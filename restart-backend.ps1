# Restart the backend server with the updated CORS configuration
Write-Host "Stopping existing backend processes..." -ForegroundColor Yellow

# Find and stop any Node.js processes running the backend
$nodePids = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "backend" } | Select-Object -ExpandProperty Id

if ($nodePids) {
    foreach ($pid in $nodePids) {
        Write-Host "Stopping Node.js process with PID: $pid" -ForegroundColor Yellow
        taskkill /PID $pid /F
    }
    Write-Host "Backend processes stopped" -ForegroundColor Green
} else {
    Write-Host "No backend processes found to stop" -ForegroundColor Green
}

# Navigate to the backend directory
Set-Location -Path "c:\My Project\barber-store\backend"

# Install any missing dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

# Start the backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Write-Host "The server will run in the background. Check the console for any errors." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "index.js" -NoNewWindow

Write-Host "Backend server started with updated CORS configuration" -ForegroundColor Green
Write-Host "Your backend API is available at http://localhost:5000" -ForegroundColor Cyan
