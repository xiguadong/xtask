# xtask Scripts

## Available Scripts

### Build
```bash
./scripts/build.sh
```
Builds the frontend for production.

### Start
```bash
./scripts/start.sh [port]
```
Builds frontend and starts the server. Default port: 3000

Example:
```bash
./scripts/start.sh 8080
```

### Stop
```bash
./scripts/stop.sh
```
Scans current-user xtask-related ports/processes and stops them. Logs to `logs/stop.log`.

## Usage

```bash
# Start server on default port 3000
./scripts/start.sh

# Start server on custom port
./scripts/start.sh 8080

# Stop server
./scripts/stop.sh
```
