@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title OCBM - Ollama LAN Setup
cd /d "%~dp0"

REM ============================================================
REM  OCBM - Windows helper for Ollama LAN access
REM  Double-click to run.
REM  Use --dry-run to preview without changing anything.
REM ============================================================

set "PORT=11434"
set "RULE_NAME=OCBM Ollama 11434"
set "DRY_RUN="
if /i "%~1"=="--dry-run" set "DRY_RUN=1"

echo ============================================================
echo   OCBM - เปิด Ollama ให้มือถือเชื่อมต่อผ่าน Wi-Fi
echo ============================================================
echo.

if defined DRY_RUN (
  echo [dry-run] โหมดทดสอบ: จะไม่เปลี่ยนค่าและไม่เปิด firewall
  echo.
) else (
  net session >nul 2>&1
  if errorlevel 1 (
    echo [!] ต้องใช้สิทธิ์ Administrator เพื่อตั้งค่าและเปิด firewall
    echo     กำลังเปิดหน้าต่างขออนุญาต...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    if errorlevel 1 (
      echo [!] ยกเลิกการขอสิทธิ์ Administrator
      echo.
      pause
    )
    exit /b
  )
)

echo [1/5] ตั้งค่าให้ Ollama รับการเชื่อมต่อจากอุปกรณ์อื่น...
if defined DRY_RUN (
  echo    [dry-run] setx /M OLLAMA_HOST "0.0.0.0:%PORT%"
  echo    [dry-run] setx /M OLLAMA_ORIGINS "*"
) else (
  set "OLLAMA_HOST=0.0.0.0:%PORT%"
  set "OLLAMA_ORIGINS=*"
  setx /M OLLAMA_HOST "0.0.0.0:%PORT%" >nul
  if errorlevel 1 (
    echo    [!] ตั้งค่า OLLAMA_HOST ไม่สำเร็จ
  ) else (
    echo    OK: OLLAMA_HOST=0.0.0.0:%PORT%
  )
  setx /M OLLAMA_ORIGINS "*" >nul
  if errorlevel 1 (
    echo    [!] ตั้งค่า OLLAMA_ORIGINS ไม่สำเร็จ
  ) else (
    echo    OK: OLLAMA_ORIGINS=*
  )
)

echo.
echo [2/5] เปิดพอร์ต %PORT% ใน Windows Firewall...
if defined DRY_RUN (
  echo    [dry-run] netsh advfirewall firewall add rule name="%RULE_NAME%" dir=in action=allow protocol=TCP localport=%PORT% profile=any
) else (
  netsh advfirewall firewall delete rule name="%RULE_NAME%" >nul 2>&1
  netsh advfirewall firewall add rule name="%RULE_NAME%" dir=in action=allow protocol=TCP localport=%PORT% profile=any >nul
  if errorlevel 1 (
    echo    [!] เปิด firewall ไม่สำเร็จ
  ) else (
    echo    OK: อนุญาต TCP พอร์ต %PORT%
  )
)

echo.
echo [3/5] ตรวจหา Ollama...
set "OLLAMA_EXE="
set "OLLAMA_APP="
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe" set "OLLAMA_APP=%LOCALAPPDATA%\Programs\Ollama\ollama app.exe"
if not defined OLLAMA_EXE if exist "%ProgramFiles%\Ollama\ollama.exe" set "OLLAMA_EXE=%ProgramFiles%\Ollama\ollama.exe"
if not defined OLLAMA_APP if exist "%ProgramFiles%\Ollama\ollama app.exe" set "OLLAMA_APP=%ProgramFiles%\Ollama\ollama app.exe"
if not defined OLLAMA_EXE (
  for /f "delims=" %%P in ('where ollama 2^>nul') do if not defined OLLAMA_EXE set "OLLAMA_EXE=%%P"
)
if not defined OLLAMA_EXE if defined OLLAMA_APP set "OLLAMA_EXE=%OLLAMA_APP%"

if not defined OLLAMA_EXE (
  echo    [!] ไม่พบ Ollama ในเครื่อง
  echo        ดาวน์โหลดได้ที่ https://ollama.com/download
  echo        หลังติดตั้งแล้ว ให้รันไฟล์นี้อีกครั้ง
  echo.
  pause
  exit /b 1
)
echo    พบ: !OLLAMA_EXE!

echo.
echo [4/5] รีสตาร์ท Ollama เพื่อให้อ่านค่าใหม่...
if defined DRY_RUN (
  echo    [dry-run] ปิด Ollama ที่กำลังทำงาน
  echo    [dry-run] เปิด Ollama ใหม่
) else (
  taskkill /IM "ollama app.exe" /F >nul 2>&1
  taskkill /IM "ollama.exe" /F >nul 2>&1
  timeout /t 2 /nobreak >nul

  if defined OLLAMA_APP (
    start "" "!OLLAMA_APP!"
  ) else (
    start "Ollama Server" cmd /k ""!OLLAMA_EXE!" serve"
  )

  echo    กำลังรอ Ollama เริ่มทำงาน...
  set "READY="
  for /l %%i in (1,1,15) do (
    if not defined READY (
      powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%PORT%' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>&1
      if !errorlevel! equ 0 set "READY=1"
      if not defined READY timeout /t 1 /nobreak >nul
    )
  )

  if defined READY (
    echo    OK: Ollama ทำงานแล้ว
  ) else (
    echo    [!] Ollama ยังไม่ตอบสนอง — ลองเปิด Ollama เองแล้วรอสักครู่
  )
)

echo.
echo [5/5] ที่อยู่สำหรับเชื่อมต่อจากมือถือ:
set "FOUND_IP="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | ForEach-Object { $_.IPv4Address.IPAddress }"`) do (
  echo    http://%%I:%PORT%
  if not defined FOUND_IP set "FOUND_IP=%%I"
)

if not defined FOUND_IP (
  echo    [!] ไม่พบ IP ของเครือข่าย — ตรวจสอบ Wi-Fi/LAN
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   ใช้บนมือถือ
echo ============================================================
echo   1. ต่อมือถือ Wi-Fi เดียวกับคอม
echo   2. เปิดเบราว์เซอร์มือถือ ไปที่:
echo      http://!FOUND_IP!:%PORT%
echo      ถ้าเห็น "Ollama is running" แสดงว่าเชื่อมได้
echo   3. เปิดแอป OCBM - Settings - Connection Settings
echo      ใส่ Base URL: http://!FOUND_IP!:%PORT%
echo      กด Test Connection แล้ว Save
echo.
echo   หมายเหตุ: ปิด VPN / หลีกเลี่ยง guest Wi-Fi
echo   ใช้เฉพาะเครือข่ายที่คุณเชื่อถือ เพราะพอร์ตนี้เปิดให้อุปกรณ์ใน LAN
echo   ถ้า IP เปลี่ยนหลังรีสตาร์ท ให้รันไฟล์นี้อีกครั้ง
echo ============================================================
echo.

if defined DRY_RUN (
  echo [dry-run] เสร็จสิ้นการทดสอบ
) else (
  echo !FOUND_IP! | clip >nul 2>&1
  echo คัดลอก IP ไปยัง clipboard แล้ว: !FOUND_IP!
)

echo.
pause
endlocal
