# Launch-YDSG.ps1
# Khoi dong YDSG kiosk tren PC quay phong kham.
#
# Cach dung:
#   1. Sua $url ben duoi thanh domain VPS that (vd: https://ydsg.example.com)
#   2. Right-click file -> Run with PowerShell
#   3. Hoac tao shortcut, target:
#        powershell.exe -ExecutionPolicy Bypass -File "C:\path\to\Launch-YDSG.ps1"
#
# Lan dau moi PC: Cloudflare Access se hoi email -> nhap email phong kham
# -> nhan OTP qua email -> dan vao -> session 7 ngay.

$url = "https://app.example.com"

# Tim Chrome (uu tien Chrome, fallback Edge)
$browser = $null
$candidates = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)
foreach ($path in $candidates) {
    if (Test-Path $path) { $browser = $path; break }
}

if (-not $browser) {
    Write-Host "Khong tim thay Chrome hoac Edge. Vui long cai Chrome." -ForegroundColor Red
    Read-Host "Nhan Enter de thoat"
    exit 1
}

# Kiosk fullscreen, an thanh dia chi, khong de nguoi dung thoat browser de dang
$args = @(
    "--kiosk",
    "--app=$url",
    "--disable-features=TranslateUI,InfiniteSessionRestore",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-pinch",
    "--overscroll-history-navigation=0"
)

Start-Process -FilePath $browser -ArgumentList $args
