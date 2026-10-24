# Script triển khai Oan Tu Ti AI Arena bằng Podman thuần (không cần cài thêm docker hay docker-compose)
param(
    [ValidateSet("up", "down", "status", "build", "logs")]
    [string]$Action = "up"
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = (Resolve-Path "$PSScriptRoot/..").Path

function Show-Status {
    Write-Host "`n=== Container Status ===" -ForegroundColor Cyan
    podman ps -a --filter "name=uet-arena-local"
}

if ($Action -eq "status") {
    Show-Status
    exit 0
}

if ($Action -eq "down") {
    Write-Host "Stopping and removing containers..." -ForegroundColor Yellow
    podman stop uet-arena-local-judge-1 uet-arena-local-app-1 uet-arena-local-db-1 2>$null
    podman rm uet-arena-local-judge-1 uet-arena-local-app-1 uet-arena-local-db-1 2>$null
    Write-Host "Containers stopped." -ForegroundColor Green
    exit 0
}

if ($Action -eq "logs") {
    podman logs -f uet-arena-local-app-1
    exit 0
}

# 1. Kiểm tra secrets
if (-not (Test-Path "$WorkspaceRoot/.secrets/local-postgres-url") -or -not (Test-Path "$WorkspaceRoot/.secrets/local-judge-token")) {
    Write-Host "Chưa tìm thấy secrets, đang khởi tạo qua npm run local:init..." -ForegroundColor Yellow
    npm run local:init
}

# 2. Tạo networks nếu chưa có
$existingNetworks = podman network ls --format "{{.Name}}"
if ("uet-arena-local_database" -notin $existingNetworks) {
    podman network create --internal uet-arena-local_database
}
if ("uet-arena-local_judge" -notin $existingNetworks) {
    podman network create --internal uet-arena-local_judge
}
if ("uet-arena-local_web" -notin $existingNetworks) {
    podman network create uet-arena-local_web
}

# 3. Build images nếu cần
Write-Host "Building images with Podman..." -ForegroundColor Cyan
podman build -t uet-arena-app:local-postgres -f "$WorkspaceRoot/docker/Dockerfile.local" "$WorkspaceRoot"
podman build -t oan-tu-ti-judge:local -f "$WorkspaceRoot/judge/Dockerfile" "$WorkspaceRoot"

if ($Action -eq "build") {
    Write-Host "Build finished successfully." -ForegroundColor Green
    exit 0
}

# 4. Chạy DB container nếu chưa chạy
$dbRunning = podman ps --filter "name=uet-arena-local-db-1" --format "{{.Names}}"
if (-not $dbRunning) {
    Write-Host "Starting db container..." -ForegroundColor Cyan
    podman rm -f uet-arena-local-db-1 2>$null
    podman run -d `
        --name uet-arena-local-db-1 `
        --network uet-arena-local_database `
        --network-alias db `
        --restart unless-stopped `
        --memory 1g `
        --cpus 1 `
        --health-cmd "pg_isready -U arena -d arena" `
        --health-interval 5s `
        --health-timeout 3s `
        --health-retries 20 `
        -e POSTGRES_USER=arena `
        -e POSTGRES_DB=arena `
        -e POSTGRES_PASSWORD_FILE=/run/secrets/db-password `
        -v "uet-arena-local_local-postgres:/var/lib/postgresql" `
        -v "$WorkspaceRoot/.secrets/local-postgres-password:/run/secrets/db-password:ro" `
        -v "$WorkspaceRoot/backups/local:/backups" `
        docker.io/library/postgres:18-bookworm
} else {
    Write-Host "Database container is already running." -ForegroundColor Green
}

# 5. Chạy App container
Write-Host "Starting app container..." -ForegroundColor Cyan
podman rm -f uet-arena-local-app-1 2>$null
podman run -d `
    --name uet-arena-local-app-1 `
    --init `
    --network uet-arena-local_database `
    --network-alias app `
    -p 127.0.0.1:3000:3000 `
    --restart unless-stopped `
    --memory 2g `
    --cpus 2 `
    --cap-drop ALL `
    --security-opt no-new-privileges:true `
    --health-cmd "node -e `"fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))`"" `
    --health-interval 10s `
    --health-timeout 5s `
    --health-start-period 40s `
    --health-retries 12 `
    -e PUBLIC_ORIGIN="http://localhost:3000" `
    -e DATABASE_URL_FILE=/run/secrets/database-url `
    -e DATABASE_DRIVER=pg `
    -e PG_POOL_MAX=20 `
    -e JUDGE_TOKEN_FILE=/run/secrets/judge-token `
    -v "$WorkspaceRoot/.secrets/local-postgres-url:/run/secrets/database-url:ro" `
    -v "$WorkspaceRoot/.secrets/local-judge-token:/run/secrets/judge-token:ro" `
    uet-arena-app:local-postgres

# Connect app to additional networks
podman network connect uet-arena-local_web uet-arena-local-app-1 2>$null
podman network connect --alias app uet-arena-local_judge uet-arena-local-app-1 2>$null

# 6. Chạy Judge container
Write-Host "Starting judge container..." -ForegroundColor Cyan
podman rm -f uet-arena-local-judge-1 2>$null
podman run -d `
    --name uet-arena-local-judge-1 `
    --init `
    --network uet-arena-local_judge `
    --network-alias judge `
    --read-only `
    --tmpfs "/tmp:size=32m,noexec,nosuid" `
    --restart unless-stopped `
    --memory 2g `
    --cpus 2 `
    --pids-limit 128 `
    --cap-drop ALL `
    --security-opt no-new-privileges:true `
    -e CONTROL_URL=http://app:3000 `
    -e JUDGE_TOKEN_FILE=/run/secrets/judge-token `
    -v "$WorkspaceRoot/.secrets/local-judge-token:/run/secrets/judge-token:ro" `
    oan-tu-ti-judge:local

Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
Write-Host "Website: http://localhost:3000/competition" -ForegroundColor Cyan
Show-Status

