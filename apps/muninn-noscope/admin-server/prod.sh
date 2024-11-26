# prod.sh
#!/bin/bash

# Load environment variables
set -a
source /etc/admin-server/.env
set +a

# Configuration
APP_DIR="/opt/admin-server"
REPO_URL="your-github-repo-url"
LOG_FILE="/var/log/admin-server/app.log"
PID_FILE="/var/run/admin-server.pid"
BINARY_NAME="admin-server"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to check if service is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to stop service
stop_service() {
    echo "Stopping service..."
    if is_running; then
        pid=$(cat "$PID_FILE")
        kill -TERM "$pid"
        wait_count=0
        while is_running && [ $wait_count -lt 30 ]; do
            sleep 1
            wait_count=$((wait_count + 1))
        done
        if is_running; then
            echo "Force killing service..."
            kill -9 "$pid"
        fi
        rm -f "$PID_FILE"
    fi
}

# Function to start service
start_service() {
    echo "Starting service..."
    cd "$APP_DIR" || exit 1
    
    # Build the application
    go build -o "$BINARY_NAME" cmd/api/main.go
    
    # Start the application
    nohup ./"$BINARY_NAME" >> "$LOG_FILE" 2>&1 &
    
    # Save PID
    echo $! > "$PID_FILE"
    
    # Wait for service to start
    sleep 5
    if is_running; then
        echo "Service started successfully"
    else
        echo "Service failed to start"
        exit 1
    fi
}

# Function to update code
update_code() {
    echo "Updating code..."
    cd "$APP_DIR" || exit 1
    
    # Fetch latest changes
    git fetch origin main
    
    # Check if we need to pull
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
        echo "New version available, updating..."
        git pull origin main
        
        # Install/update dependencies
        go mod download
        go mod tidy
        
        return 0
    fi
    
    return 1
}

# Main deployment logic
echo "Starting deployment process..."

# Stop existing service
stop_service

# Update code
if update_code; then
    echo "Code updated successfully"
else
    echo "No updates available"
fi

# Start service
start_service

echo "Deployment completed"

# Monitor logs
tail -f "$LOG_FILE"