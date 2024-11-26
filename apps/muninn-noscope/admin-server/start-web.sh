#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Ensure clean shutdown of child processes
cleanup() {
    echo "Shutting down services..."
    kill -TERM 0
    wait
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the server
echo "Starting server..."
go run cmd/api/main.go &

# Wait for any child process to exit
wait