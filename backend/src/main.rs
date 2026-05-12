use postgres::{Client, Error as PostgresError, NoTls};
use serde_derive::{Deserialize, Serialize};
use std::env;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};

#[derive(Serialize, Deserialize)]
struct User {
    id: Option<i32>,
    name: String,
    email: String,
}

const OK_RESPONSE: &str = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n\r\n";
const CREATED_RESPONSE: &str = "HTTP/1.1 201 Created\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n\r\n";
const NOT_FOUND: &str = "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
const BAD_REQUEST: &str = "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
const INTERNAL_ERROR: &str = "HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n";

fn main() {
    let db_url = match env::var("DATABASE_URL") {
        Ok(v) if !v.trim().is_empty() => v,
        _ => {
            eprintln!("DATABASE_URL is not set");
            return;
        }
    };

    if let Err(e) = set_database(&db_url) {
        eprintln!("Failed to initialize database: {e}");
        return;
    }

    let listener = match TcpListener::bind("0.0.0.0:8080") {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind server socket: {e}");
            return;
        }
    };

    println!("Server is running on port 8080");
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => handle_client(stream, &db_url),
            Err(e) => eprintln!("Failed to accept connection: {e}"),
        }
    }
}

fn set_database(db_url: &str) -> Result<(), PostgresError> {
    let mut client = Client::connect(db_url, NoTls)?;
    client.batch_execute(
        "
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            email VARCHAR NOT NULL
        )
        ",
    )?;
    Ok(())
}

fn get_id(request: &str) -> &str {
    request
        .split('/')
        .nth(4)
        .unwrap_or_default()
        .split_whitespace()
        .next()
        .unwrap_or_default()
}

fn get_user_request_body(request: &str) -> Result<User, serde_json::Error> {
    serde_json::from_str(request.split("\r\n\r\n").last().unwrap_or_default())
}

fn handle_client(mut stream: TcpStream, db_url: &str) {
    let mut buffer = [0; 2048];
    let mut request = String::new();

    match stream.read(&mut buffer) {
        Ok(size) => {
            request.push_str(&String::from_utf8_lossy(&buffer[..size]));

            let (status_line, content) = match &*request {
                r if r.starts_with("OPTIONS") => (OK_RESPONSE.to_string(), String::new()),
                r if r.starts_with("POST /api/rust/users") => handle_post_request(r, db_url),
                r if r.starts_with("GET /api/rust/users/") => handle_get_request(r, db_url),
                r if r.starts_with("GET /api/rust/users") => handle_get_all_request(db_url),
                r if r.starts_with("PUT /api/rust/users/") => handle_put_request(r, db_url),
                r if r.starts_with("DELETE /api/rust/users/") => handle_delete_request(r, db_url),
                _ => (
                    NOT_FOUND.to_string(),
                    "{\"error\":\"404 not found\"}".to_string(),
                ),
            };

            let _ = stream.write_all(format!("{}{}", status_line, content).as_bytes());
        }
        Err(e) => eprintln!("Unable to read stream: {e}"),
    }
}

fn handle_post_request(request: &str, db_url: &str) -> (String, String) {
    match (get_user_request_body(request), Client::connect(db_url, NoTls)) {
        (Ok(user), Ok(mut client)) => {
            let row = match client.query_one(
                "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
                &[&user.name, &user.email],
            ) {
                Ok(r) => r,
                Err(_) => {
                    return (
                        INTERNAL_ERROR.to_string(),
                        "{\"error\":\"failed to create user\"}".to_string(),
                    );
                }
            };

            let created_user = User {
                id: Some(row.get(0)),
                name: user.name,
                email: user.email,
            };

            match serde_json::to_string(&created_user) {
                Ok(body) => (CREATED_RESPONSE.to_string(), body),
                Err(_) => (
                    INTERNAL_ERROR.to_string(),
                    "{\"error\":\"serialization failed\"}".to_string(),
                ),
            }
        }
        (Err(_), _) => (
            BAD_REQUEST.to_string(),
            "{\"error\":\"invalid request body\"}".to_string(),
        ),
        _ => (
            INTERNAL_ERROR.to_string(),
            "{\"error\":\"database unavailable\"}".to_string(),
        ),
    }
}

fn handle_get_request(request: &str, db_url: &str) -> (String, String) {
    match (get_id(request).parse::<i32>(), Client::connect(db_url, NoTls)) {
        (Ok(id), Ok(mut client)) => match client.query_one(
            "SELECT id, name, email FROM users WHERE id = $1",
            &[&id],
        ) {
            Ok(row) => {
                let user = User {
                    id: Some(row.get(0)),
                    name: row.get(1),
                    email: row.get(2),
                };
                match serde_json::to_string(&user) {
                    Ok(body) => (OK_RESPONSE.to_string(), body),
                    Err(_) => (
                        INTERNAL_ERROR.to_string(),
                        "{\"error\":\"serialization failed\"}".to_string(),
                    ),
                }
            }
            Err(_) => (
                NOT_FOUND.to_string(),
                "{\"error\":\"user not found\"}".to_string(),
            ),
        },
        _ => (
            INTERNAL_ERROR.to_string(),
            "{\"error\":\"internal error\"}".to_string(),
        ),
    }
}

fn handle_get_all_request(db_url: &str) -> (String, String) {
    match Client::connect(db_url, NoTls) {
        Ok(mut client) => match client.query("SELECT id, name, email FROM users", &[]) {
            Ok(rows) => {
                let users: Vec<User> = rows
                    .iter()
                    .map(|row| User {
                        id: Some(row.get(0)),
                        name: row.get(1),
                        email: row.get(2),
                    })
                    .collect();

                match serde_json::to_string(&users) {
                    Ok(body) => (OK_RESPONSE.to_string(), body),
                    Err(_) => (
                        INTERNAL_ERROR.to_string(),
                        "{\"error\":\"serialization failed\"}".to_string(),
                    ),
                }
            }
            Err(_) => (
                INTERNAL_ERROR.to_string(),
                "{\"error\":\"failed to read users\"}".to_string(),
            ),
        },
        Err(_) => (
            INTERNAL_ERROR.to_string(),
            "{\"error\":\"database unavailable\"}".to_string(),
        ),
    }
}

fn handle_put_request(request: &str, db_url: &str) -> (String, String) {
    match (
        get_id(request).parse::<i32>(),
        get_user_request_body(request),
        Client::connect(db_url, NoTls),
    ) {
        (Ok(id), Ok(user), Ok(mut client)) => {
            match client.execute(
                "UPDATE users SET name = $1, email = $2 WHERE id = $3",
                &[&user.name, &user.email, &id],
            ) {
                Ok(0) => (
                    NOT_FOUND.to_string(),
                    "{\"error\":\"user not found\"}".to_string(),
                ),
                Ok(_) => (
                    OK_RESPONSE.to_string(),
                    "{\"message\":\"user updated successfully\"}".to_string(),
                ),
                Err(_) => (
                    INTERNAL_ERROR.to_string(),
                    "{\"error\":\"failed to update user\"}".to_string(),
                ),
            }
        }
        (Err(_), _, _) => (
            BAD_REQUEST.to_string(),
            "{\"error\":\"invalid user id\"}".to_string(),
        ),
        (_, Err(_), _) => (
            BAD_REQUEST.to_string(),
            "{\"error\":\"invalid request body\"}".to_string(),
        ),
        _ => (
            INTERNAL_ERROR.to_string(),
            "{\"error\":\"internal error\"}".to_string(),
        ),
    }
}

fn handle_delete_request(request: &str, db_url: &str) -> (String, String) {
    match (get_id(request).parse::<i32>(), Client::connect(db_url, NoTls)) {
        (Ok(id), Ok(mut client)) => {
            match client.execute("DELETE FROM users WHERE id = $1", &[&id]) {
                Ok(0) => (
                    NOT_FOUND.to_string(),
                    "{\"error\":\"user not found\"}".to_string(),
                ),
                Ok(_) => (
                    OK_RESPONSE.to_string(),
                    "{\"message\":\"user deleted successfully\"}".to_string(),
                ),
                Err(_) => (
                    INTERNAL_ERROR.to_string(),
                    "{\"error\":\"failed to delete user\"}".to_string(),
                ),
            }
        }
        _ => (
            INTERNAL_ERROR.to_string(),
            "{\"error\":\"internal error\"}".to_string(),
        ),
    }
}