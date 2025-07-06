# 센서 게임 플랫폼 개발 가이드

## 📋 개요
이 문서는 기존 센서 게임 플랫폼에 새로운 게임을 추가하기 위한 완벽한 개발 가이드입니다. 이 가이드를 따르면 WebSocket 센서 시스템과 완벽히 호환되는 게임을 개발할 수 있습니다.

## 🏗️ 시스템 아키텍처

### 기존 인프라
- **WebSocket 서버**: `sensor-websocket-server.js` (포트 8080/8443)
- **센서 클라이언트**: 모바일 디바이스용 센서 데이터 송신
- **게임 허브**: 메인 인덱스 페이지에서 게임 선택
- **지원 센서**: 자이로스코프, 가속도계, 방향센서

### 게임 등록 시스템
```javascript
// /index.html의 게임 카드 추가 위치
<div class="game-grid">
    <!-- 기존 게임들 -->
    <!-- 새 게임은 여기에 추가 -->
</div>
```

## 🎮 필수 구현 사항

### 1. 폴더 구조
```
/your-game-name/
├── index.html          # 게임 메인 페이지
├── css/
│   └── style.css       # 게임 스타일
└── js/
    ├── main.js         # 메인 게임 로직
    ├── gameEngine.js   # 렌더링 엔진 (선택)
    ├── sensorManager.js # 센서 관리자
    └── physics.js      # 물리 엔진 (선택)
```

### 2. 센서 매니저 구현 (필수)

**파일명**: `/your-game-name/js/sensorManager.js`

```javascript
class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'YourGame-' + Math.random().toString(36).substr(2, 9);
        
        // 센서 데이터 저장
        this.sensorData = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            gyroscope: { alpha: 0, beta: 0, gamma: 0 },
            timestamp: Date.now()
        };
        
        // 게임 입력 (이 형식 반드시 준수)
        this.tiltInput = {
            x: 0,        // 좌우 기울기 (-1 ~ 1)
            y: 0,        // 앞뒤 기울기 (-1 ~ 1)
            brake: 0,    // 브레이크 (0 ~ 1)
            handbrake: 0 // 핸드브레이크 (0 ~ 1)
        };
        
        this.callbacks = [];
        this.connectToServer();
    }
    
    connectToServer() {
        try {
            const serverHost = window.location.hostname || 'localhost';
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const serverPort = protocol === 'wss' ? '8443' : '8080';
            
            this.socket = new WebSocket(`${protocol}://${serverHost}:${serverPort}`);
            
            this.socket.onopen = () => {
                this.isConnected = true;
                console.log('🎮 [YourGame] 센서 시스템 연결 성공');
                this.socket.send(JSON.stringify({ 
                    type: 'game_client_register', 
                    deviceId: this.deviceId,
                    gameType: 'your_game_type',
                    capabilities: ['orientation', 'accelerometer', 'gyroscope']
                }));
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'sensor_data') {
                        this.processSensorData(data.data);
                    }
                } catch (error) {
                    console.error('센서 데이터 처리 오류:', error);
                }
            };
            
            this.socket.onclose = () => {
                this.isConnected = false;
                console.log('센서 연결 끊김. 시뮬레이션 모드로 전환...');
                this.startSimulationMode();
            };
            
            this.socket.onerror = () => {
                console.error('센서 연결 오류. 시뮬레이션 모드 시작...');
                this.startSimulationMode();
            };
            
        } catch (error) {
            console.error('센서 서버 연결 실패:', error);
            this.startSimulationMode();
        }
    }
    
    // 센서 데이터 처리 (게임별로 커스터마이징 가능)
    processSensorData(data) {
        this.sensorData.timestamp = Date.now();
        
        if (data.orientation) {
            this.sensorData.orientation = data.orientation;
        }
        if (data.accelerometer) {
            this.sensorData.accelerometer = data.accelerometer;
        }
        if (data.gyroscope) {
            this.sensorData.gyroscope = data.gyroscope;
        }
        
        // 게임 입력으로 변환 (게임별로 수정 필요)
        this.convertToGameInput();
        
        // 콜백 호출
        this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
    }
    
    // 센서 데이터를 게임 입력으로 변환 (게임별 커스터마이징 필수)
    convertToGameInput() {
        const orientation = this.sensorData.orientation;
        
        // 예시: 기본 매핑 (게임 특성에 맞게 수정)
        this.tiltInput.x = this.clamp((orientation.gamma || 0) / 45, -1, 1);
        this.tiltInput.y = this.clamp((orientation.beta || 0) / 45, -1, 1);
        
        // 가속도계로 특수 입력 감지
        const accel = this.sensorData.accelerometer;
        if (accel) {
            const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
            if (magnitude > 15) {
                this.tiltInput.handbrake = 1.0;
                setTimeout(() => { this.tiltInput.handbrake = 0; }, 500);
            }
        }
    }
    
    // 시뮬레이션 모드 (센서 없을 때 키보드 대체)
    startSimulationMode() {
        if (this.simulationInterval) return;
        
        console.warn('🎮 시뮬레이션 모드 시작 (WASD/화살표 키)');
        this.isConnected = false;
        
        const keys = {};
        document.addEventListener('keydown', (e) => { keys[e.code] = true; });
        document.addEventListener('keyup', (e) => { keys[e.code] = false; });
        
        this.simulationInterval = setInterval(() => {
            let targetX = 0, targetY = 0;
            
            // 기본 키 매핑 (게임별로 수정 가능)
            if (keys['KeyA'] || keys['ArrowLeft']) targetX = -1;
            if (keys['KeyD'] || keys['ArrowRight']) targetX = 1;
            if (keys['KeyW'] || keys['ArrowUp']) targetY = 1;
            if (keys['KeyS'] || keys['ArrowDown']) targetY = -1;
            
            // 부드러운 전환
            this.tiltInput.x = this.lerp(this.tiltInput.x, targetX, 0.1);
            this.tiltInput.y = this.lerp(this.tiltInput.y, targetY, 0.1);
            this.tiltInput.brake = keys['Space'] ? 1 : 0;
            
            this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
        }, 16);
    }
    
    // 공개 API
    onSensorData(callback) {
        this.callbacks.push(callback);
    }
    
    getTiltInput() {
        return { ...this.tiltInput };
    }
    
    // 유틸리티
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
}
```

### 3. 메인 게임 클래스 (필수)

**파일명**: `/your-game-name/js/main.js`

```javascript
class YourGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 센서 매니저 초기화 (필수)
        this.sensorManager = new SensorManager();
        
        // 게임 상태
        this.gameState = {
            isPlaying: false,
            score: 0,
            level: 1
        };
        
        this.init();
    }
    
    init() {
        console.log('🎮 [YourGame] 게임 초기화');
        
        // 센서 콜백 등록 (필수)
        this.sensorManager.onSensorData((tiltInput, sensorData) => {
            this.handleSensorInput(tiltInput, sensorData);
        });
        
        this.setupEventListeners();
        this.startGameLoop();
        
        // 로딩 화면 숨기기
        document.getElementById('loadingScreen').style.display = 'none';
    }
    
    // 센서 입력 처리 (게임별 로직 구현)
    handleSensorInput(tiltInput, sensorData) {
        // 예시: 플레이어 객체 이동
        if (this.player) {
            this.player.x += tiltInput.x * 5;
            this.player.y += tiltInput.y * 5;
        }
    }
    
    // 게임 루프 (필수)
    gameLoop = (currentTime) => {
        if (!this.gameState.isPlaying) return;
        
        const deltaTime = (currentTime - (this.lastTime || currentTime)) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // 게임 로직 업데이트
    }
    
    render() {
        // 게임 렌더링
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 게임 객체들 그리기
    }
    
    startGameLoop() {
        this.gameState.isPlaying = true;
        requestAnimationFrame(this.gameLoop);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        // 기타 이벤트 리스너
    }
    
    handleResize() {
        // 화면 크기 조정 처리
    }
}

// 전역 함수 (게임 허브 호환성을 위해 필요)
function restartGame() {
    if (window.game) {
        window.game = new YourGame();
    }
}

function goToMain() {
    window.location.href = '/';
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 [YourGame] 로딩...');
    window.game = new YourGame();
});
```

### 4. HTML 템플릿 (필수)

**파일명**: `/your-game-name/index.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Your Game Name</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="gameContainer">
        <!-- 메인 메뉴 버튼 (필수) -->
        <a href="../index.html" class="back-to-main">🏠 메인으로</a>
        
        <!-- 로딩 화면 (필수) -->
        <div class="loading" id="loadingScreen">
            <h1>🎮 Your Game Name</h1>
            <p>게임을 준비하는 중...</p>
        </div>
        
        <!-- 게임 캔버스 (필수) -->
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        
        <!-- UI 오버레이 -->
        <div class="ui-overlay">
            <div class="game-info">
                <span>점수: <span id="scoreDisplay">0</span></span>
                <span>레벨: <span id="levelDisplay">1</span></span>
            </div>
            
            <!-- 센서 상태 (필수) -->
            <div class="sensor-status">
                <div id="sensorConnection">📡 센서 연결 대기중...</div>
                <div>X: <span id="tiltX">0</span>° | Y: <span id="tiltY">0</span>°</div>
            </div>
        </div>
        
        <!-- 게임 오버 화면 (권장) -->
        <div class="game-over" id="gameOverScreen">
            <h2>🎮 게임 종료!</h2>
            <p>최종 점수: <span id="finalScore">0</span></p>
            <button onclick="restartGame()">다시 시작</button>
            <button onclick="goToMain()">🏠 메인으로</button>
        </div>
    </div>
    
    <!-- 스크립트 로드 순서 중요 -->
    <script src="js/sensorManager.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

## 🎨 CSS 가이드라인

### 필수 스타일 클래스
```css
/* 기본 레이아웃 */
#gameContainer {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: #333;
    color: white;
    overflow: hidden;
}

/* 메인 버튼 (필수) */
.back-to-main {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    text-decoration: none;
    z-index: 100;
}

/* 센서 상태 (필수) */
.sensor-status {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 10px;
    font-size: 14px;
}

/* 로딩 화면 (필수) */
.loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

/* 게임 오버 */
.game-over {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    display: none;
}
```

## 🔗 게임 허브 등록

### 메인 인덱스에 게임 추가
`/index.html`의 게임 그리드에 추가:

```html
<div class="game-card" onclick="window.location.href='/your-game-name'">
    <div class="game-icon">🎮</div>
    <h3>Your Game Name</h3>
    <p>게임 설명</p>
    <div class="play-button">플레이</div>
</div>
```

### 서버 라우팅 추가
`sensor-websocket-server.js`에 라우트 추가:

```javascript
// 기존 라우트들 아래에 추가
app.get('/your-game-name', (req, res) => {
    res.sendFile(path.join(__dirname, 'your-game-name', 'index.html'));
});
```

## 📱 센서 매핑 가이드

### 일반적인 센서 용도
- **orientation.gamma**: 좌우 기울기 (-90° ~ 90°)
- **orientation.beta**: 앞뒤 기울기 (-180° ~ 180°)
- **orientation.alpha**: 나침반 방향 (0° ~ 360°)
- **accelerometer**: 중력 + 움직임 (급격한 움직임 감지)
- **gyroscope**: 회전 속도 (빠른 움직임 감지)

### 게임 장르별 권장 매핑

**레이싱 게임**:
```javascript
// 조향: gamma, 가속/브레이크: beta
this.tiltInput.x = orientation.gamma / 45;
this.tiltInput.y = -orientation.beta / 45;
```

**플랫포머 게임**:
```javascript
// 좌우 이동: gamma, 점프: 급격한 위로 움직임
this.tiltInput.x = orientation.gamma / 30;
this.tiltInput.jump = accelerometer.y < -8;
```

**퍼즐 게임**:
```javascript
// 4방향 이동: gamma/beta 임계값 기반
this.tiltInput.left = orientation.gamma < -20;
this.tiltInput.right = orientation.gamma > 20;
this.tiltInput.up = orientation.beta < -20;
this.tiltInput.down = orientation.beta > 20;
```

## ⚠️ 주의사항

### 필수 준수 사항
1. **센서 매니저 클래스명**: 반드시 `SensorManager` 사용
2. **콜백 인터페이스**: `onSensorData(callback)` 형식 준수
3. **입력 객체 형식**: `{ x, y, brake, handbrake }` 구조 유지
4. **전역 함수**: `restartGame()`, `goToMain()` 반드시 구현
5. **HTML 요소 ID**: `gameCanvas`, `loadingScreen`, `sensorConnection` 필수

### 성능 최적화
- 센서 데이터 처리는 60fps 기준으로 최적화
- 불필요한 DOM 조작 최소화
- requestAnimationFrame 사용 권장

### 호환성 고려사항
- iOS Safari: HTTPS 필요 (센서 권한)
- Android Chrome: HTTP/HTTPS 모두 지원
- 센서 연결 실패 시 키보드 대체 모드 필수

## 📝 예시 게임 참고

기존 구현된 게임들을 참고하세요:
- `/ball-rolling-game/`: 2D 물리 기반 게임
- `/spaceship-game/`: 3D 우주선 게임  
- `/racing-game/`: 레이싱 게임

## 🧪 테스트 체크리스트

개발 완료 후 다음 사항들을 확인하세요:

- [ ] 센서 연결 시 정상 동작
- [ ] 센서 연결 실패 시 키보드 모드 동작
- [ ] 메인 메뉴 버튼 정상 동작
- [ ] 게임 재시작 기능 정상 동작
- [ ] 모바일 디바이스에서 센서 입력 테스트
- [ ] 다양한 화면 크기에서 UI 확인
- [ ] 게임 허브에서 정상 연결 확인

이 가이드를 따라 개발하면 기존 센서 게임 플랫폼과 완벽히 호환되는 게임을 만들 수 있습니다.