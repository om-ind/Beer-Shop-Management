# Flutter Setup Script for Beer Shop Mobile App
# Run this in PowerShell as Administrator

Write-Host "=== Beer Shop Manager - Flutter Setup ===" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if Flutter is installed
$flutterPath = "C:\src\flutter\bin\flutter.bat"
if (Test-Path $flutterPath) {
    Write-Host "[OK] Flutter already installed at C:\src\flutter" -ForegroundColor Green
} else {
    Write-Host "[!] Flutter not found. Please follow these steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Download Flutter SDK:" -ForegroundColor Cyan
    Write-Host "   https://flutter.dev/docs/get-started/install/windows"
    Write-Host ""
    Write-Host "2. Extract to C:\src\flutter"
    Write-Host ""
    Write-Host "3. Add to PATH:"
    Write-Host "   C:\src\flutter\bin"
    Write-Host ""
    Write-Host "4. Restart PowerShell and run this script again"
    Write-Host ""
    exit 1
}

# Step 2: Navigate to mobile_app
$mobileAppPath = Join-Path $PSScriptRoot ".."
Set-Location $mobileAppPath

Write-Host "[*] Installing Flutter dependencies..." -ForegroundColor Cyan
& flutter pub get

Write-Host ""
Write-Host "[*] Running Flutter analyze..." -ForegroundColor Cyan
& flutter analyze

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "To run on Android emulator:" -ForegroundColor Cyan
Write-Host "  flutter run"
Write-Host ""
Write-Host "To build debug APK:" -ForegroundColor Cyan
Write-Host "  flutter build apk --debug"
Write-Host ""
Write-Host "IMPORTANT: Make sure the Flask backend is running on port 5000" -ForegroundColor Yellow
Write-Host "Android emulator maps 10.0.2.2:5000 -> localhost:5000" -ForegroundColor Yellow
