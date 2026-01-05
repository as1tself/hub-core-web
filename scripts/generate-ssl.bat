@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: ==============================================
:: SSL 인증서 생성 스크립트 (로컬 개발용)
:: Vite HTTPS 개발 서버용 key.pem, cert.pem 생성
:: ==============================================

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "SSL_DIR=%PROJECT_ROOT%\ssl"
set "KEY_PATH=%SSL_DIR%\key.pem"
set "CERT_PATH=%SSL_DIR%\cert.pem"

:: ==============================================
:: OpenSSL 자동 탐색
:: ==============================================
set "OPENSSL="

:: 1. PATH에서 openssl 탐색
for %%i in (openssl.exe) do (
    set "OPENSSL_PATH=%%~$PATH:i"
    if defined OPENSSL_PATH (
        set "OPENSSL=%%~$PATH:i"
        echo [INFO] PATH에서 OpenSSL 발견: !OPENSSL!
        goto :openssl_found
    )
)

:: 2. Git for Windows 내장 OpenSSL 탐색
if exist "C:\Program Files\Git\usr\bin\openssl.exe" (
    set "OPENSSL=C:\Program Files\Git\usr\bin\openssl.exe"
    echo [INFO] Git for Windows에서 OpenSSL 발견: !OPENSSL!
    goto :openssl_found
)

if exist "C:\Program Files (x86)\Git\usr\bin\openssl.exe" (
    set "OPENSSL=C:\Program Files (x86)\Git\usr\bin\openssl.exe"
    echo [INFO] Git for Windows (x86)에서 OpenSSL 발견: !OPENSSL!
    goto :openssl_found
)

:: 3. Chocolatey로 설치된 OpenSSL 탐색
if exist "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" (
    set "OPENSSL=C:\Program Files\OpenSSL-Win64\bin\openssl.exe"
    echo [INFO] OpenSSL-Win64에서 발견: !OPENSSL!
    goto :openssl_found
)

if exist "C:\Program Files\OpenSSL\bin\openssl.exe" (
    set "OPENSSL=C:\Program Files\OpenSSL\bin\openssl.exe"
    echo [INFO] OpenSSL에서 발견: !OPENSSL!
    goto :openssl_found
)

:: 4. Scoop으로 설치된 OpenSSL 탐색
if exist "%USERPROFILE%\scoop\apps\openssl\current\bin\openssl.exe" (
    set "OPENSSL=%USERPROFILE%\scoop\apps\openssl\current\bin\openssl.exe"
    echo [INFO] Scoop에서 OpenSSL 발견: !OPENSSL!
    goto :openssl_found
)

:: 5. WinGet으로 설치된 OpenSSL 탐색
for %%d in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\ShiningLight.OpenSSL*") do (
    if exist "%%~d\bin\openssl.exe" (
        set "OPENSSL=%%~d\bin\openssl.exe"
        echo [INFO] WinGet에서 OpenSSL 발견: !OPENSSL!
        goto :openssl_found
    )
)

:: OpenSSL을 찾지 못한 경우
echo [ERROR] OpenSSL을 찾을 수 없습니다.
echo         다음 중 하나를 수행해주세요:
echo         1. Git for Windows 설치 (OpenSSL 포함)
echo         2. OpenSSL 설치: choco install openssl
echo         3. OpenSSL을 PATH에 추가
exit /b 1

:openssl_found

:: ssl 디렉토리 생성
if not exist "%SSL_DIR%" (
    echo [INFO] ssl 디렉토리 생성 중...
    mkdir "%SSL_DIR%"
)

:: 기존 인증서 삭제
if exist "%KEY_PATH%" (
    echo [INFO] 기존 key.pem 삭제 중...
    del /f "%KEY_PATH%"
)
if exist "%CERT_PATH%" (
    echo [INFO] 기존 cert.pem 삭제 중...
    del /f "%CERT_PATH%"
)

:: 자체 서명 인증서 생성
echo [INFO] SSL 인증서 생성 중...

"!OPENSSL!" req -x509 -newkey rsa:2048 -nodes ^
    -keyout "%KEY_PATH%" ^
    -out "%CERT_PATH%" ^
    -days 365 ^
    -subj "/C=KR/ST=Seoul/L=Seoul/O=Hub-CoreWeb/OU=Development/CN=localhost" ^
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

if %errorlevel% equ 0 (
    echo [SUCCESS] SSL 인증서 생성 완료
    echo           - Key:  %KEY_PATH%
    echo           - Cert: %CERT_PATH%
    echo.
    echo [TIP] vite.config.ts에서 다음과 같이 사용하세요:
    echo       server: {
    echo         https: {
    echo           key: fs.readFileSync^('./ssl/key.pem'^),
    echo           cert: fs.readFileSync^('./ssl/cert.pem'^),
    echo         ^}
    echo       ^}
) else (
    echo [ERROR] SSL 인증서 생성 실패
    exit /b 1
)

endlocal
