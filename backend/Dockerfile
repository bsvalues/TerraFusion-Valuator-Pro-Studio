# Build stage
FROM rust:1.81-slim-bookworm as builder

WORKDIR /usr/src/app

# Copy the entire backend directory to access workspace members
COPY . .

# Build argument to specify which binary to build
ARG SERVICE_NAME

# Build the specific service
# We assume the context is the 'backend' directory
RUN cargo build --release -p ${SERVICE_NAME}

# Runtime stage
FROM debian:bookworm-slim

ARG SERVICE_NAME

# Install OpenSSL and ca-certificates
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/bin

# Copy the binary from the builder stage
# The binary name typically matches the package name
COPY --from=builder /usr/src/app/target/release/${SERVICE_NAME} ./service

# Expose the API port (this is just documentation, actual exposure happens in compose)
EXPOSE 8080

CMD ["./service"]
