$ErrorActionPreference = 'Stop'
Write-Host "Hydrating public assets..."
Get-ChildItem -Path "android\app\src\main\assets\public" -Recurse -File | ForEach-Object {
    [System.IO.File]::ReadAllBytes($_.FullName) | Out-Null
}

Write-Host "Building debug APK..."
Set-Location android
.\gradlew assembleDebug --no-daemon -x lint

Write-Host "Copying output APKs..."
Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\apk\cassielll1.apk" -Force
Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\cassielll1.apk" -Force
Write-Host "cassielll1.apk build complete!"
