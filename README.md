# 🎮 센서 기반 게임 플랫폼

모바일 센서(자이로스코프, 가속도계)를 활용한 실시간 게임 플랫폼입니다. WebSocket을 통해 휴대폰 센서 데이터를 수집하고, 다양한 게임에서 활용할 수 있습니다.

## 🚀 주요 기능

### 🎱 볼 굴리기 게임 (신규)
- **센서 기반 조작**: 휴대폰을 기울여서 공을 굴립니다
- **10개 레벨**: 튜토리얼부터 최종 보스까지 점진적 난이도
- **물리 엔진**: 중력, 마찰, 충돌 등 현실적인 물리 시뮬레이션
- **파티클 효과**: 충돌, 목표 달성 시 시각적 효과
- **Web Audio API**: 게임 이벤트에 따른 효과음

### 🚀 3D 우주선 게임
- **3D 환경**: Three.js 기반 3차원 우주 공간
- **센서 조작**: 휴대폰 기울기로 우주선 조작
- **실시간 렌더링**: 부드러운 3D 애니메이션

### 📊 센서 모니터링
- **실시간 대시보드**: 센서 데이터 시각화
- **다중 디바이스 지원**: 여러 휴대폰 동시 연결
- **데이터 분석**: 자이로스코프, 가속도계, 방향 데이터

## 🛠 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (ES6+)
- **3D 그래픽**: Three.js
- **2D 그래픽**: Canvas API
- **실시간 통신**: WebSocket
- **백엔드**: Node.js
- **물리 엔진**: 커스텀 2D 물리 시뮬레이션
- **오디오**: Web Audio API

## 📱 지원 플랫폼

- **iOS**: Safari (HTTPS 필요)
- **Android**: Chrome, Samsung Internet
- **데스크톱**: Chrome, Firefox, Safari, Edge

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/cmhblue1225/sensor_game.git
cd sensor_game
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 서버 시작
```bash
npm start
```

### 4. 게임 접속
- **볼 굴리기 게임**: http://localhost:8080/ball-game
- **3D 우주선 게임**: http://localhost:8080/game
- **센서 대시보드**: http://localhost:8080/sensor-dashboard.html

### 5. 모바일 센서 연결
휴대폰에서 다음 주소로 접속:
- **센서 클라이언트**: http://[컴퓨터IP]:8080/sensor-client.html

## 🎮 게임 조작법

### 볼 굴리기 게임
- **센서 모드**: 휴대폰을 기울여서 공을 조작
- **키보드 모드**: WASD 또는 화살표 키
- **일시정지**: 스페이스바 또는 화면 터치
- **센서 보정**: R 키

### 3D 우주선 게임
- **센서 모드**: 휴대폰 기울기로 우주선 조작
- **키보드 모드**: WASD 키

## 📋 게임 레벨

### 볼 굴리기 게임 레벨 구성
1. **레벨 1**: 기본 튜토리얼
2. **레벨 2**: 구멍 피하기
3. **레벨 3**: 미로 탈출
4. **레벨 4**: 다중 목표
5. **레벨 5**: 좁은 통로
6. **레벨 6**: 플랫폼 점프
7. **레벨 7**: 복잡한 미로
8. **레벨 8**: 타이밍 챌린지
9. **레벨 9**: 정밀 조작
10. **레벨 10**: 최종 보스

## 🔧 HTTPS 설정 (iOS 센서 권한)

iOS에서 센서 권한을 사용하려면 HTTPS가 필요합니다:

```bash
# 자체 서명 인증서 생성
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

HTTPS 서버: https://localhost:8443

## 📁 프로젝트 구조

```
sensor_game/
├── ball-rolling-game/          # 볼 굴리기 게임
│   ├── index.html
│   └── js/
│       ├── main.js             # 게임 메인 로직
│       ├── ballPhysics.js      # 물리 엔진
│       ├── gameEngine.js       # 렌더링 엔진
│       ├── levelManager.js     # 레벨 관리
│       └── sensorManager.js    # 센서 데이터 처리
├── spaceship-game/             # 3D 우주선 게임
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── sensor-client.html          # 모바일 센서 클라이언트
├── sensor-dashboard.html       # 센서 모니터링 대시보드
├── sensor-websocket-server.js  # WebSocket 서버
└── package.json
```

## 🎯 주요 특징

### 센서 데이터 처리
- **실시간 수집**: WebSocket을 통한 지연 없는 데이터 전송
- **데이터 스무싱**: 센서 노이즈 제거를 위한 이동평균 필터
- **자동 보정**: 사용자 환경에 맞는 센서 캘리브레이션
- **시뮬레이션 모드**: 센서 없이도 키보드로 테스트 가능

### 물리 시뮬레이션
- **중력 시스템**: 현실적인 중력 효과
- **충돌 감지**: 원-사각형, 원-원 충돌 처리
- **탄성 충돌**: 벽과 장애물에서의 반발
- **마찰력**: 표면에 따른 속도 감소

### 게임 플레이
- **점진적 난이도**: 쉬운 레벨부터 어려운 레벨까지
- **다양한 장애물**: 벽, 구멍, 이동 플랫폼
- **목표 시스템**: 단일/다중 목표 달성
- **생명 시스템**: 실수 허용을 위한 라이프 시스템

## 🔧 개발자 정보

### 버전 기록
- **v2.0**: 볼 굴리기 게임 추가, 물리 엔진 개발
- **v1.0**: 3D 우주선 게임, 센서 모니터링 시스템

### 기여하기
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의사항

이슈나 문의사항이 있으시면 GitHub Issues를 통해 연락해주세요.

---

**Made with ❤️ using Web Technologies and Mobile Sensors**