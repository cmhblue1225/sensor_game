class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'HurdleGame-' + Math.random().toString(36).substr(2, 9);
        
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
            handbrake: 0, // 핸드브레이크 (0 ~ 1)
            jump: false  // 점프 플래그 추가
        };
        
        this.callbacks = [];
        this.connectToServer();

        this.lastJumpTime = 0;
        this.jumpCooldown = 500; // 0.5초 쿨다운
    }
    
    connectToServer() {
        try {
            const serverHost = window.location.hostname || 'localhost';
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const serverPort = protocol === 'wss' ? '8443' : '8080';
            
            this.socket = new WebSocket(`${protocol}://${serverHost}:${serverPort}`);
            
            this.socket.onopen = () => {
                this.isConnected = true;
                console.log('🎮 [HurdleGame] 센서 시스템 연결 성공');
                document.getElementById('sensorConnection').innerText = '📡 센서 연결됨';
                this.socket.send(JSON.stringify({ 
                    type: 'game_client_register', 
                    deviceId: this.deviceId,
                    gameType: 'hurdle_game',
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
                document.getElementById('sensorConnection').innerText = '📡 센서 연결 끊김 (시뮬레이션 모드)';
                this.startSimulationMode();
            };
            
            this.socket.onerror = () => {
                console.error('센서 연결 오류. 시뮬레이션 모드 시작...');
                document.getElementById('sensorConnection').innerText = '📡 센서 연결 오류 (시뮬레이션 모드)';
                this.startSimulationMode();
            };
            
        } catch (error) {
            console.error('센서 서버 연결 실패:', error);
            document.getElementById('sensorConnection').innerText = '📡 센서 연결 실패 (시뮬레이션 모드)';
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
        
        // 센서 값 UI 업데이트
        document.getElementById('tiltX').innerText = this.sensorData.orientation.gamma.toFixed(1);
        document.getElementById('tiltY').innerText = this.sensorData.orientation.beta.toFixed(1);
        document.getElementById('accelY').innerText = this.sensorData.accelerometer.y.toFixed(1);

        // 게임 입력으로 변환 (게임별로 수정 필요)
        this.convertToGameInput();
        
        // 콜백 호출
        this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
    }
    
    // 센서 데이터를 게임 입력으로 변환 (게임별 커스터마이징 필수)
    convertToGameInput() {
        const orientation = this.sensorData.orientation;
        const accelerometer = this.sensorData.accelerometer;
        
        // 예시: 기본 매핑 (게임 특성에 맞게 수정)
        this.tiltInput.x = this.clamp((orientation.gamma || 0) / 45, -1, 1); // 좌우 이동 (사용 안 할 수도 있음)
        this.tiltInput.y = this.clamp((orientation.beta || 0) / 45, -1, 1); // 앞뒤 이동 (사용 안 할 수도 있음)
        
        // 가속도계 Y축 값으로 점프 감지
        const currentTime = Date.now();
        if (accelerometer.y > 7 && (currentTime - this.lastJumpTime > this.jumpCooldown)) {
            this.tiltInput.jump = true;
            this.lastJumpTime = currentTime;
        } else {
            this.tiltInput.jump = false;
        }
    }
    
    // 시뮬레이션 모드 (센서 없을 때 키보드 대체)
    startSimulationMode() {
        if (this.simulationInterval) return;
        
        console.warn('🎮 시뮬레이션 모드 시작 (WASD/화살표 키, 스페이스바 점프)');
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
            this.tiltInput.brake = keys['Space'] ? 1 : 0; // 스페이스바는 브레이크 대신 점프에 사용

            const currentTime = Date.now();
            if (keys['Space'] && (currentTime - this.lastJumpTime > this.jumpCooldown)) {
                this.tiltInput.jump = true;
                this.lastJumpTime = currentTime;
            } else {
                this.tiltInput.jump = false;
            }
            
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