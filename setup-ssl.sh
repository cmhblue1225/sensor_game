#!/bin/bash

# SSL 인증서 생성 스크립트
echo "🔐 SSL 인증서 생성 중..."

# 기존 인증서 삭제
rm -f cert.pem key.pem

# 자체 서명 인증서 생성 (모든 IP와 도메인에서 사용 가능)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=SensorGame/OU=Development/CN=localhost" \
  -config <(
    echo '[req]'
    echo 'distinguished_name = req'
    echo 'req_extensions = v3_req'
    echo '[v3_req]'
    echo 'basicConstraints = CA:FALSE'
    echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
    echo 'extendedKeyUsage = serverAuth'
    echo 'subjectAltName = @alt_names'
    echo '[alt_names]'
    echo 'DNS.1 = localhost'
    echo 'DNS.2 = *.local'
    echo 'IP.1 = 127.0.0.1'
    echo 'IP.2 = 192.168.0.117'
    echo 'IP.3 = 0.0.0.0'
  ) -extensions v3_req

echo "✅ SSL 인증서가 생성되었습니다."
echo "📱 모바일에서 다음 주소로 접속하세요:"
echo "   https://192.168.0.117:8443/sensor-client.html"
echo ""
echo "⚠️  브라우저에서 보안 경고가 나타나면:"
echo "   1. '고급' 또는 'Advanced' 클릭"
echo "   2. '안전하지 않음으로 이동' 또는 'Proceed to...' 클릭"
echo "   3. iOS Safari: 설정 > Safari > 고급 > 실험적 기능에서 허용"

chmod +x setup-ssl.sh