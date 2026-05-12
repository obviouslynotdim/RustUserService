# Build stage
FROM rust:1.85-bookworm AS builder

WORKDIR /app

COPY . .

RUN cargo build --release

# Production stage
FROM debian:bookworm-slim

WORKDIR /user/local/bin

COPY --from=builder /app/target/release/backend .

CMD [ "./backend" ]