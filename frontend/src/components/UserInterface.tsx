import React, { useState, useEffect } from "react";
import axios from "axios";
import CardComponent from "./CardComponent";

interface User {
    id: number;
    name: string;
    email: string;
}

interface UserInterfaceProps {
    backendName: string;
}

const UserInterface: React.FC<UserInterfaceProps> = ({ backendName }) => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({ name: "", email: "" });
    const [updateUser, setUpdateUser] = useState({ id: "", name: "", email: "" });
    
    // Define styles based on the backend name
    const backgroundColors: { [key: string]: string } = {
        "Rust": "bg-orange-500",
    };

    const textColors: { [key: string]: string } = {
        "Rust": "bg-orange-700 hover:bg-orange-600",
    };

    const backgroundColor = backgroundColors[backendName as keyof typeof backgroundColors] || "bg-gray-200";
    const btnColor = textColors[backendName as keyof typeof textColors] || "bg-gray-700 hover:bg-gray-600";

    // fetch users from the backend
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${apiUrl}/${backendName}/users`);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
    };     
     
    fetchUsers();
}, [backendName, apiUrl]);

    // other functions
    return (
        <div className={`user-interface ${backgroundColor} ${backendName} w-full min-h-screen p-4`}>
            <img src={`/${backendName.toLowerCase()}.png`} alt={`${backendName} logo`} className="w-16 h-16 mb-4" />

            {/* display users */}
           <div className="space-y-4">
                {users.map((user) => (
                    <div key={user.id}>
                        <CardComponent user={user} />
                        <button onClick={() => deleteUser(user.id)} className={`${btnColor} text-white px-4 py-2 rounded mt-2`}>
                            Delete User
                        </button>
                    </div>
                ))}
           </div>

           
        </div>
    )
}