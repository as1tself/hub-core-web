#!/bin/bash
# ==============================================
# SSL 인증서 생성 스크립트 (로컬 개발용)
# Vite HTTPS 개발 서버용 key.pem, cert.pem 생성
# ==============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SSL_DIR="$PROJECT_ROOT/ssl"
KEY_PATH="$SSL_DIR/key.pem"
CERT_PATH="$SSL_DIR/cert.pem"

# ==============================================
# OpenSSL 자동 탐색
# ==============================================
find_openssl() {
    # 1. PATH에서 openssl 탐색
    if command -v openssl &> /dev/null; then
        command -v openssl
        return 0
    fi

    # 2. Homebrew 경로 탐색 (macOS)
    for brew_prefix in "/opt/homebrew/bin" "/usr/local/bin"; do
        if [ -x "$brew_prefix/openssl" ]; then
            echo "$brew_prefix/openssl"
            return 0
        fi
    done

    # 3. LibreSSL (macOS 기본)
    if [ -x "/usr/bin/openssl" ]; then
        echo "/usr/bin/openssl"
        return 0
    fi

    # 4. Linux 일반 경로
    for path in "/usr/bin/openssl" "/usr/local/bin/openssl"; do
        if [ -x "$path" ]; then
            echo "$path"
            return 0
        fi
    done

    return 1
}

OPENSSL=$(find_openssl)

if [ -z "$OPENSSL" ]; then
    echo "[ERROR] OpenSSL을 찾을 수 없습니다."
    echo "        다음 중 하나를 수행해주세요:"
    echo "        - macOS: brew install openssl"
    echo "        - Ubuntu/Debian: sudo apt install openssl"
    echo "        - CentOS/RHEL: sudo yum install openssl"
    exit 1
fi

echo "[INFO] OpenSSL 발견: $OPENSSL"

# ssl 디렉토리 생성
if [ ! -d "$SSL_DIR" ]; then
    echo "[INFO] ssl 디렉토리 생성 중..."
    mkdir -p "$SSL_DIR"
fi

# 기존 인증서 삭제
if [ -f "$KEY_PATH" ]; then
    echo "[INFO] 기존 key.pem 삭제 중..."
    rm -f "$KEY_PATH"
fi
if [ -f "$CERT_PATH" ]; then
    echo "[INFO] 기존 cert.pem 삭제 중..."
    rm -f "$CERT_PATH"
fi

# 자체 서명 인증서 생성
echo "[INFO] SSL 인증서 생성 중..."

"$OPENSSL" req -x509 -newkey rsa:2048 -nodes \
    -keyout "$KEY_PATH" \
    -out "$CERT_PATH" \
    -days 365 \
    -subj "/C=KR/ST=Seoul/L=Seoul/O=Hub-CoreWeb/OU=Development/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

if [ $? -eq 0 ]; then
    echo "[SUCCESS] SSL 인증서 생성 완료"
    echo "          - Key:  $KEY_PATH"
    echo "          - Cert: $CERT_PATH"
    echo ""
    echo "[TIP] vite.config.ts에서 다음과 같이 사용하세요:"
    echo "      server: {"
    echo "        https: {"
    echo "          key: fs.readFileSync('./ssl/key.pem'),"
    echo "          cert: fs.readFileSync('./ssl/cert.pem'),"
    echo "        }"
    echo "      }"
else
    echo "[ERROR] SSL 인증서 생성 실패"
    exit 1
fi
