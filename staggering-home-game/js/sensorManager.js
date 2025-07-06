class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'StaggeringHomeGame-' + Math.random().toString(36).substr(2, 9);
        
        this.sensorData = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            gyroscope: { alpha: 0, beta: 0, gamma: 0 },
            timestamp: Date.now()
        };
        
        this.tiltInput = {
            x: 0,
            y: 0,
            action: false
        };
        
        this.callbacks = [];
        this.connectToServer();

        this.lastActionTime = 0;
        this.actionCooldown = 1000;
    }
    
    connectToServer() {
        try {
            const serverHost = window.location.hostname || 'localhost';
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const serverPort = protocol === 'wss' ? '8443' : '8080';
            
            this.socket = new WebSocket(`${protocol}://${serverHost}:${serverPort}`);
            
            this.socket.onopen = () => {
                this.isConnected = true;
                console.log('🎮 [StaggeringHomeGame] 센서 시스템 연결 성공');
                document.getElementById('sensorConnection').innerText = '📡 센서 연결됨';
                this.socket.send(JSON.stringify({ 
                    type: 'game_client_register', 
                    deviceId: this.deviceId,
                    gameType: 'staggering_home_game',
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
    
    processSensorData(data) {
        this.sensorData.timestamp = Date.now();
        
        if (data.orientation) this.sensorData.orientation = data.orientation;
        if (data.accelerometer) this.sensorData.accelerometer = data.accelerometer;
        
        this.updateSensorUI();
        this.convertToGameInput();
        
        this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
    }
    
    convertToGameInput() {
        const orientation = this.sensorData.orientation;
        const accelerometer = this.sensorData.accelerometer;
        
        this.tiltInput.x = this.clamp((orientation.gamma || 0) / 45, -1, 1);
        this.tiltInput.y = this.clamp(((orientation.beta || 0) - 45) / 45, -1, 1);

        const currentTime = Date.now();
        const totalAcceleration = Math.sqrt(accelerometer.x**2 + accelerometer.y**2 + accelerometer.z**2);
        if (totalAcceleration > 20 && (currentTime - this.lastActionTime > this.actionCooldown)) {
            this.tiltInput.action = true;
            this.lastActionTime = currentTime;
        } else {
            this.tiltInput.action = false;
        }
    }
    
    startSimulationMode() {
        if (this.simulationInterval) return;
        
        console.warn('🎮 시뮬레이션 모드 시작 (WASD/화살표 키, 스페이스바 액션)');
        this.isConnected = false;
        
        const keys = {};
        document.addEventListener('keydown', (e) => { keys[e.code] = true; });
        document.addEventListener('keyup', (e) => { keys[e.code] = false; });
        
        this.simulationInterval = setInterval(() => {
            let targetX = 0, targetY = 0;
            
            if (keys['KeyA'] || keys['ArrowLeft']) targetX = -1;
            if (keys['KeyD'] || keys['ArrowRight']) targetX = 1;
            if (keys['KeyW'] || keys['ArrowUp']) targetY = 1;
            if (keys['KeyS'] || keys['ArrowDown']) targetY = -1;
            
            this.tiltInput.x = this.lerp(this.tiltInput.x, targetX, 0.1);
            this.tiltInput.y = this.lerp(this.tiltInput.y, targetY, 0.1);

            const currentTime = Date.now();
            if (keys['Space'] && (currentTime - this.lastActionTime > this.actionCooldown)) {
                this.tiltInput.action = true;
                this.lastActionTime = currentTime;
            } else {
                this.tiltInput.action = false;
            }
            
            this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
        }, 16);
    }

    updateSensorUI() {
        document.getElementById('tiltX').innerText = (this.sensorData.orientation.gamma || 0).toFixed(1);
        document.getElementById('tiltY').innerText = (this.sensorData.orientation.beta || 0).toFixed(1);
        const accel = this.sensorData.accelerometer;
        const totalAccel = Math.sqrt(accel.x**2 + accel.y**2 + accel.z**2);
        document.getElementById('accel').innerText = totalAccel.toFixed(1);
    }
    
    onSensorData(callback) {
        this.callbacks.push(callback);
    }
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
}
