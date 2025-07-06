class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'Shooter-Game-' + Math.random().toString(36).substr(2, 9);
        
        this.sensorData = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            accelerometer: { x: 0, y: 0, z: 0 }
        };
        
        // 게임 입력 (조준, 발사)
        this.tiltInput = {
            x: 0,  // 조준 X (-1 ~ 1)
            y: 0,  // 조준 Y (-1 ~ 1)
            shoot: false // 발사 플래그
        };
        
        this.calibration = {
            orientation: { beta: 0, gamma: 0 }
        };
        
        this.dataHistory = { orientation: [], accelerometer: [] };
        this.historySize = 5; // 스무딩을 위한 히스토리 크기
        
        this.callbacks = [];
        this.connectToServer();

        this.lastShootTime = 0;
        this.shootCooldown = 200; // 발사 쿨다운 (ms)
        this.shakeThreshold = 15; // 흔들림 감지 임계값 (가속도 크기)

        // For simulation mode
        this.simulationInterval = null;
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
    }
    
    connectToServer() {
        try {
            const serverHost = window.location.hostname || 'localhost';
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const serverPort = protocol === 'wss' ? '8443' : '8080';
            
            this.socket = new WebSocket(`${protocol}://${serverHost}:${serverPort}`);
            
            this.socket.onopen = () => {
                this.isConnected = true;
                console.log('🎮 슈팅 게임 센서 연결 성공');
                document.getElementById('sensorConnection').innerText = '📡 센서 연결됨';
                this.socket.send(JSON.stringify({ 
                    type: 'game_client_register', 
                    deviceId: this.deviceId,
                    gameType: 'shooter_game',
                    capabilities: ['orientation', 'accelerometer']
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
            
            this.socket.onerror = (error) => {
                console.error('센서 연결 오류. 시뮬레이션 모드 시작...', error);
                document.getElementById('sensorConnection').innerText = '📡 센서 연결 오류 (시뮬레이션 모드)';
                this.startSimulationMode();
            };
            
        } catch (error) {
            console.error('센서 서버 연결 실패:', error);
            document.getElementById('sensorConnection').innerText = '📡 센서 연결 실패 (시뮬레이션 모드)';
            this.startSimulationMode();
        }
    }
    
    processSensorData(data) {
        this.sensorData.timestamp = Date.now();
        
        if (data.orientation) {
            this.addToHistory('orientation', data.orientation);
            this.sensorData.orientation = this.getSmoothedData('orientation');
        }
        if (data.accelerometer) {
            this.addToHistory('accelerometer', data.accelerometer);
            this.sensorData.accelerometer = this.getSmoothedData('accelerometer');
        }
        
        this.convertToGameInput();
        this.updateUI();
        this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
    }
    
    convertToGameInput() {
        const orientation = this.sensorData.orientation;
        const accelerometer = this.sensorData.accelerometer;
        const currentTime = Date.now();

        // 조준: orientation.gamma (좌우)와 orientation.beta (상하) 사용
        // -90 ~ 90도를 -1 ~ 1 범위로 매핑 (감도 조절)
        this.tiltInput.x = this.clamp(orientation.gamma / 90, -1, 1); 
        this.tiltInput.y = this.clamp(orientation.beta / 90, -1, 1); 

        // 발사: 가속도계 흔들림 감지
        const accelMagnitude = Math.sqrt(
            accelerometer.x * accelerometer.x +
            accelerometer.y * accelerometer.y +
            accelerometer.z * accelerometer.z
        );

        if (accelMagnitude > this.shakeThreshold && (currentTime - this.lastShootTime > this.shootCooldown)) {
            this.tiltInput.shoot = true;
            this.lastShootTime = currentTime;
        } else {
            this.tiltInput.shoot = false;
        }
    }
    
    addToHistory(type, data) {
        this.dataHistory[type].push(data);
        if (this.dataHistory[type].length > this.historySize) {
            this.dataHistory[type].shift();
        }
    }
    
    getSmoothedData(type) {
        const history = this.dataHistory[type];
        if (history.length === 0) return { x: 0, y: 0, z: 0, alpha: 0, beta: 0, gamma: 0 };
        
        const avg = history.reduce((acc, data) => {
            for (const key in data) {
                if (typeof data[key] === 'number') {
                    acc[key] = (acc[key] || 0) + data[key];
                }
            }
            return acc;
        }, {});
        
        for (const key in avg) {
            avg[key] /= history.length;
        }
        return avg;
    }

    startSimulationMode() {
        if (this.simulationInterval) return;
        console.warn('🎮 시뮬레이션 모드 시작 (마우스로 조준, 클릭으로 발사)');
        this.isConnected = false;
        
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', (e) => {
            // Map mouse position to normalized tiltInput values
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;

            this.tiltInput.x = this.clamp((this.mouse.x / canvas.width) * 2 - 1, -1, 1); // -1 to 1
            this.tiltInput.y = this.clamp((this.mouse.y / canvas.height) * 2 - 1, -1, 1); // -1 to 1
        });
        canvas.addEventListener('mousedown', () => { this.mouse.down = true; });
        canvas.addEventListener('mouseup', () => { this.mouse.down = false; });

        this.simulationInterval = setInterval(() => {
            const currentTime = Date.now();
            if (this.mouse.down && (currentTime - this.lastShootTime > this.shootCooldown)) {
                this.tiltInput.shoot = true;
                this.lastShootTime = currentTime;
            } else {
                this.tiltInput.shoot = false;
            }
            this.updateUI();
            this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
        }, 16);
    }
    
    updateUI() {
        document.getElementById('aimX').innerText = this.tiltInput.x.toFixed(2);
        document.getElementById('aimY').innerText = this.tiltInput.y.toFixed(2);
        const accelMag = Math.sqrt(
            this.sensorData.accelerometer.x * this.sensorData.accelerometer.x +
            this.sensorData.accelerometer.y * this.sensorData.accelerometer.y +
            this.sensorData.accelerometer.z * this.sensorData.accelerometer.z
        );
        document.getElementById('accelMag').innerText = accelMag.toFixed(2);
    }
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    onSensorData(callback) {
        this.callbacks.push(callback);
    }
    
    getTiltInput() {
        return { ...this.tiltInput };
    }
}
