/**
 * 레이싱 게임용 센서 매니저
 * 휴대폰 기울기를 감지하여 자동차의 조향 및 가속/감속 제어
 */
class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'Racing-Game-' + Math.random().toString(36).substr(2, 9);
        
        this.sensorData = {
            orientation: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 게임 입력 (조향, 가속)
        this.tiltInput = {
            x: 0,  // 좌우 기울기 (조향: -1 ~ 1)
            y: 0   // 앞뒤 기울기 (가속/감속: -1 ~ 1)
        };
        
        this.calibration = {
            orientation: { beta: 0, gamma: 0 }
        };
        
        this.dataHistory = { orientation: [] };
        this.historySize = 5; // 스무딩을 위해 약간 늘림
        
        this.sensitivity = {
            tilt: 0.8,  // 조향 감도 (기존 1.2에서 하향 조정)
            deadzone: 5 // 데드존 (기존 3에서 상향 조정)
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
                console.log('🏎️ 레이싱 게임 센서 연결 성공');
                this.socket.send(JSON.stringify({ type: 'game_client_register', deviceId: this.deviceId }));
                this.onConnectionChange(true);
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
                console.log('센서 연결 끊김. 3초 후 재연결 시도...');
                this.onConnectionChange(false);
                setTimeout(() => this.connectToServer(), 3000);
            };
            
            this.socket.onerror = (error) => {
                console.error('센서 연결 오류:', error);
                this.startSimulationMode();
            };
            
        } catch (error) {
            console.error('센서 서버 연결 실패:', error);
            this.startSimulationMode();
        }
    }
    
    processSensorData(data) {
        if (!data.orientation) return;
        
        this.addToHistory('orientation', data.orientation);
        const smoothed = this.getSmoothedData('orientation');
        
        const calibratedBeta = smoothed.beta - this.calibration.orientation.beta;
        const calibratedGamma = smoothed.gamma - this.calibration.orientation.gamma;
        
        this.updateTiltInput(calibratedBeta, calibratedGamma);
        
        this.sensorData.orientation = { ...smoothed, calibratedBeta, calibratedGamma };
        
        this.updateUI();
        this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
    }
    
    updateTiltInput(beta, gamma) {
        const deadzone = this.sensitivity.deadzone;
        
        // 좌우 기울기 (gamma) -> 조향 (x)
        let steer = 0;
        if (Math.abs(gamma) > deadzone) {
            steer = gamma / 45.0; // -45~45도를 -1~1 범위로 매핑
        }
        this.tiltInput.x = this.clamp(steer * this.sensitivity.tilt, -1, 1);

        // 앞뒤 기울기 (beta) -> 가속/감속 (y)
        let accel = 0;
        if (Math.abs(beta) > deadzone) {
            accel = beta / 45.0; // -45~45도를 -1~1 범위로 매핑
        }
        // y 값은 가속/후진을 위해 반전시킴 (앞으로 기울이면 음수)
        this.tiltInput.y = -this.clamp(accel * this.sensitivity.tilt, -1, 1);
    }
    
    addToHistory(type, data) {
        this.dataHistory[type].push(data);
        if (this.dataHistory[type].length > this.historySize) {
            this.dataHistory[type].shift();
        }
    }
    
    getSmoothedData(type) {
        const history = this.dataHistory[type];
        if (history.length === 0) return { alpha: 0, beta: 0, gamma: 0 };
        
        const avg = history.reduce((acc, data) => {
            acc.alpha += data.alpha;
            acc.beta += data.beta;
            acc.gamma += data.gamma;
            return acc;
        }, { alpha: 0, beta: 0, gamma: 0 });
        
        return {
            alpha: avg.alpha / history.length,
            beta: avg.beta / history.length,
            gamma: avg.gamma / history.length
        };
    }
    
    calibrate() {
        if (this.dataHistory.orientation.length > 0) {
            const current = this.getSmoothedData('orientation');
            this.calibration.orientation.beta = current.beta;
            this.calibration.orientation.gamma = current.gamma;
            console.log('✅ 센서 보정 완료:', this.calibration.orientation);
        }
    }
    
    startSimulationMode() {
        if (this.simulationInterval) return; // 이미 시뮬레이션 모드일 경우 중복 실행 방지
        console.warn('센서 연결 실패. 시뮬레이션 모드로 전환합니다. (WASD/화살표 키 사용)');
        this.isConnected = false;
        this.setupSimulationControls();
        this.onConnectionChange(false);
    }
    
    setupSimulationControls() {
        const keys = {};
        document.addEventListener('keydown', (e) => { keys[e.code] = true; });
        document.addEventListener('keyup', (e) => { keys[e.code] = false; });
        
        this.simulationInterval = setInterval(() => {
            let targetX = 0;
            let targetY = 0;

            if (keys['KeyA'] || keys['ArrowLeft']) targetX = -1;
            if (keys['KeyD'] || keys['ArrowRight']) targetX = 1;
            if (keys['KeyW'] || keys['ArrowUp']) targetY = -1; // 가속
            if (keys['KeyS'] || keys['ArrowDown']) targetY = 1;  // 감속/후진

            // 부드러운 입력 전환
            this.tiltInput.x += (targetX - this.tiltInput.x) * 0.2;
            this.tiltInput.y += (targetY - this.tiltInput.y) * 0.2;

            this.updateUI();
            this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
        }, 16);
    }
    
    updateUI() {
        const steerDegrees = this.tiltInput.x * 45;
        const accelDegrees = -this.tiltInput.y * 45;
        
        document.getElementById('tiltX').textContent = steerDegrees.toFixed(1);
        document.getElementById('tiltY').textContent = accelDegrees.toFixed(1);
        
        const tiltDot = document.getElementById('tiltDot');
        if (tiltDot) {
            const maxOffset = 40;
            tiltDot.style.transform = `translate(${this.tiltInput.x * maxOffset}px, ${-this.tiltInput.y * maxOffset}px)`;
        }
    }
    
    onConnectionChange(connected) {
        const indicator = document.getElementById('sensorConnection');
        if (indicator) {
            if (connected) {
                indicator.textContent = '📡 센서 연결됨';
                indicator.style.color = '#00ff00';
            } else {
                indicator.textContent = '📡 시뮬레이션 모드 (WASD/화살표)';
                indicator.style.color = '#ffaa00';
            }
        }
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
