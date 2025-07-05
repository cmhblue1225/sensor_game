# AI 개발자용 센서 게임 개발 프롬프트

## 🎯 미션
기존 센서 게임 플랫폼에 새로운 게임을 추가하여 완벽히 통합되도록 개발하세요.

## 📋 개발 요구사항

### 필수 구현 사항
1. **WebSocket 센서 시스템 연동**: 모바일 디바이스의 자이로스코프, 가속도계, 방향센서 데이터 수신
2. **시뮬레이션 모드**: 센서 연결 실패 시 키보드 입력으로 대체
3. **게임 허브 통합**: 메인 페이지에서 접근 가능하도록 등록
4. **반응형 UI**: 다양한 화면 크기 지원

### 기술적 제약사항
- **서버**: Node.js WebSocket 서버 (포트 8080/8443)
- **프론트엔드**: HTML5 Canvas, Vanilla JavaScript (프레임워크 없음)
- **센서 데이터**: 실시간 JSON 형태로 수신
- **호환성**: iOS Safari (HTTPS), Android Chrome

## 🏗️ 아키텍처 요구사항

### 1. 폴더 구조 (필수)
```
/your-game-name/
├── index.html
├── css/style.css
└── js/
    ├── sensorManager.js  # 센서 통신 클래스
    └── main.js          # 메인 게임 로직
```

### 2. SensorManager 클래스 (필수 구현)
```javascript
class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.tiltInput = { x: 0, y: 0, brake: 0, handbrake: 0 };
        this.callbacks = [];
        this.connectToServer();
    }
    
    connectToServer() {
        // WebSocket 연결: ws://localhost:8080 또는 wss://localhost:8443
        // 등록 메시지: { type: 'game_client_register', deviceId: '...', gameType: '...' }
    }
    
    processSensorData(data) {
        // data.orientation, data.accelerometer, data.gyroscope 처리
        // this.tiltInput 업데이트 후 콜백 호출
    }
    
    startSimulationMode() {
        // WASD/화살표 키로 this.tiltInput 제어
    }
    
    onSensorData(callback) {
        this.callbacks.push(callback);
    }
}
```

### 3. 메인 게임 클래스 (필수 구현)
```javascript
class YourGame {
    constructor() {
        this.sensorManager = new SensorManager();
        this.sensorManager.onSensorData((tiltInput, sensorData) => {
            this.handleSensorInput(tiltInput, sensorData);
        });
    }
    
    handleSensorInput(tiltInput, sensorData) {
        // tiltInput.x, tiltInput.y로 게임 객체 제어
    }
}

// 전역 함수 (허브 호환성)
function restartGame() { /* 게임 재시작 */ }
function goToMain() { window.location.href = '/'; }
```

### 4. HTML 필수 요소
```html
<canvas id="gameCanvas"></canvas>
<div id="loadingScreen">로딩 중...</div>
<div id="sensorConnection">센서 상태</div>
<a href="../index.html" class="back-to-main">🏠 메인으로</a>
```

## 🎮 센서 매핑 가이드

### 센서 데이터 형식
```javascript
{
    orientation: { alpha: 0, beta: 0, gamma: 0 },    // 방향 (-180~180)
    accelerometer: { x: 0, y: 0, z: 0 },             // 가속도 (-20~20)
    gyroscope: { alpha: 0, beta: 0, gamma: 0 }       // 회전 속도
}
```

### 일반적인 매핑
- **좌우 이동**: `orientation.gamma / 45` (-1~1)
- **앞뒤 이동**: `orientation.beta / 45` (-1~1) 
- **점프/액션**: `accelerometer` 임계값 감지
- **특수 동작**: 급격한 움직임 감지

## 🔧 통합 체크리스트

### 개발 완료 후 확인사항
- [ ] 센서 연결 시 정상 동작 (모바일 테스트)
- [ ] 키보드 시뮬레이션 모드 동작 (WASD/화살표)
- [ ] 메인 메뉴 복귀 버튼 작동
- [ ] `restartGame()`, `goToMain()` 함수 구현
- [ ] 로딩 화면 → 게임 화면 전환
- [ ] 다양한 화면 크기에서 UI 정상 표시

### 서버 등록 (자동으로 안내 예정)
```javascript
// sensor-websocket-server.js에 추가할 라우트
app.get('/your-game-name', (req, res) => {
    res.sendFile(path.join(__dirname, 'your-game-name', 'index.html'));
});
```

## 🎨 게임 아이디어 제안

다음 중 하나를 선택하거나 창의적인 아이디어로 개발하세요:

1. **틸트 미로**: 공을 굴려서 목표 지점 도달
2. **센서 슈팅**: 기울임으로 조준, 흔들기로 발사
3. **밸런스 게임**: 객체 균형 맞추기
4. **센서 퍼즐**: 4방향 기울임으로 블록 이동
5. **틸트 점프**: 플랫포머 스타일 게임
6. **센서 드로잉**: 기울임으로 그림 그리기

## 💡 개발 팁

1. **센서 감도 조절**: 게임 특성에 맞게 입력 민감도 조정
2. **디바운싱**: 급격한 센서 변화 스무딩 처리
3. **시각적 피드백**: 센서 입력 상태를 화면에 표시
4. **성능 최적화**: 60fps 기준으로 최적화
5. **에러 처리**: 센서 연결 실패 상황 대비

## 🚀 시작하기

1. **게임 컨셉 결정**: 센서 입력에 적합한 게임 아이디어 선택
2. **폴더 생성**: `/your-game-name/` 구조 생성
3. **센서 매니저 구현**: WebSocket 통신 및 입력 처리
4. **게임 로직 개발**: Canvas 렌더링 및 게임 메카닉
5. **테스트**: 센서/키보드 모드 모두 확인
6. **통합**: 메인 허브에 등록

이 가이드를 따라 개발하면 기존 시스템과 완벽히 호환되는 센서 게임을 만들 수 있습니다. 질문이 있으면 언제든 문의하세요!