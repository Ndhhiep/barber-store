# Run this script to test email functionality
# This script ensures we're in the proper directory context

$scriptPath = $PSScriptRoot
$backendPath = "c:\My Project\barber-store\backend"

Write-Host "Changing to backend directory: $backendPath"
Set-Location -Path $backendPath

Write-Host "Running email test script..."
node tests/test-email.js

# Return to original directory
Set-Location -Path $scriptPath

Write-Host "Test complete."
