/**
 * 센서 데이터 관리 클래스
 * 기존 센서 모니터링 시스템과 연동하여 게임에서 사용할 센서 데이터를 관리
 */
class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'Game-Client-' + Math.random().toString(36).substr(2, 9);
        
        // 센서 데이터
        this.sensorData = {
            gyroscope: { x: 0, y: 0, z: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            orientation: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 정규화된 게임 입력 값 (-1 ~ 1)
        this.gameInput = {
            roll: 0,        // 롤 (Z축 회전)
            pitch: 0,       // 피치 (X축 회전)
            yaw: 0,         // 요 (Y축 회전)
            thrust: 0,      // 추진력
            sideThrust: 0,  // 측면 추진력
            upThrust: 0     // 상하 추진력
        };
        
        // 센서 보정값
        this.calibration = {
            gyro: { x: 0, y: 0, z: 0 },
            accel: { x: 0, y: 0, z: 0 },
            orient: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 데이터 스무싱을 위한 히스토리
        this.dataHistory = {
            gyro: [],
            accel: [],
            orient: []
        };
        this.historySize = 5;
        
        // 감도 설정 (적당히 조정)
        this.sensitivity = {
            gyro: 0.03,   // 0.005 → 0.03 (6배 증가)
            accel: 0.08,  // 0.02 → 0.08 (4배 증가)
            orient: 0.01  // 0.002 → 0.01 (5배 증가)
        };
        
        this.callbacks = [];
        this.connectToServer();
    }
    
    /**
     * WebSocket 서버에 연결
     */
    connectToServer() {
        try {
            const serverHost = window.location.hostname || 'localhost';
            let serverPort, protocol;
            
            if (window.location.protocol === 'https:') {
                serverPort = '8443';
                protocol = 'wss';
            } else {
                serverPort = '8080';
                protocol = 'ws';
            }
            
            this.socket = new WebSocket(`${protocol}://${serverHost}:${serverPort}`);
            
            this.socket.onopen = () => {
                this.isConnected = true;
                console.log('게임 센서 연결 성공');
                
                // 게임 클라이언트로 등록
                this.socket.send(JSON.stringify({
                    type: 'game_client_register',
                    deviceId: this.deviceId,
                    timestamp: Date.now()
                }));
                
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
                console.log('센서 연결 끊김');
                this.onConnectionChange(false);
                
                // 재연결 시도
                setTimeout(() => this.connectToServer(), 3000);
            };
            
            this.socket.onerror = (error) => {
                console.error('센서 연결 오류:', error);
            };
            
        } catch (error) {
            console.error('센서 서버 연결 실패:', error);
            // 시뮬레이션 모드로 전환
            this.startSimulationMode();
        }
    }
    
    /**
     * 센서 데이터 처리 및 게임 입력으로 변환
     */
    processSensorData(data) {
        // 데이터 히스토리에 추가
        this.addToHistory('gyro', data.gyroscope);
        this.addToHistory('accel', data.accelerometer);
        this.addToHistory('orient', data.orientation);
        
        // 스무싱된 데이터 계산
        const smoothedData = {
            gyroscope: this.getSmoothedData('gyro'),
            accelerometer: this.getSmoothedData('accel'),
            orientation: this.getSmoothedData('orient')
        };
        
        // 보정값 적용
        this.sensorData = {
            gyroscope: {
                x: (smoothedData.gyroscope.x - this.calibration.gyro.x),
                y: (smoothedData.gyroscope.y - this.calibration.gyro.y),
                z: (smoothedData.gyroscope.z - this.calibration.gyro.z)
            },
            accelerometer: {
                x: (smoothedData.accelerometer.x - this.calibration.accel.x),
                y: (smoothedData.accelerometer.y - this.calibration.accel.y),
                z: (smoothedData.accelerometer.z - this.calibration.accel.z)
            },
            orientation: {
                alpha: (smoothedData.orientation.alpha - this.calibration.orient.alpha),
                beta: (smoothedData.orientation.beta - this.calibration.orient.beta),
                gamma: (smoothedData.orientation.gamma - this.calibration.orient.gamma)
            }
        };
        
        // 게임 입력으로 변환
        this.updateGameInput();
        
        // 콜백 호출
        this.callbacks.forEach(callback => callback(this.gameInput, this.sensorData));
    }
    
    /**
     * 센서 데이터를 게임 입력으로 변환
     */
    updateGameInput() {
        // 센서 데이터 유효성 검사
        if (!this.sensorData.gyroscope || !this.sensorData.accelerometer || !this.sensorData.orientation) {
            return;
        }
        
        // 자이로스코프 → 회전 속도 (매우 제한적)
        let roll = this.sensorData.gyroscope.z * this.sensitivity.gyro;
        let pitch = this.sensorData.gyroscope.x * this.sensitivity.gyro;
        let yaw = this.sensorData.gyroscope.y * this.sensitivity.gyro;
        
        // 극단적인 값 필터링
        roll = this.filterExtreme(roll);
        pitch = this.filterExtreme(pitch);
        yaw = this.filterExtreme(yaw);
        
        this.gameInput.roll = this.clamp(roll, -0.8, 0.8); // 범위 확대
        this.gameInput.pitch = this.clamp(pitch, -0.8, 0.8);
        this.gameInput.yaw = this.clamp(yaw, -0.8, 0.8);
        
        // 가속도계 → 추진력 (적당히 제한적)
        let thrust = this.sensorData.accelerometer.z * this.sensitivity.accel;
        let sideThrust = this.sensorData.accelerometer.x * this.sensitivity.accel;
        let upThrust = -this.sensorData.accelerometer.y * this.sensitivity.accel;
        
        // 극단적인 값 필터링
        thrust = this.filterExtreme(thrust);
        sideThrust = this.filterExtreme(sideThrust);
        upThrust = this.filterExtreme(upThrust);
        
        this.gameInput.thrust = this.clamp(thrust, -0.8, 0.8); // 범위 확대
        this.gameInput.sideThrust = this.clamp(sideThrust, -0.8, 0.8);
        this.gameInput.upThrust = this.clamp(upThrust, -0.8, 0.8);
        
        // 방향 센서로 미세 조정 (다시 활성화)
        const orientAdjust = 0.01;
        this.gameInput.roll += this.sensorData.orientation.gamma * orientAdjust;
        this.gameInput.pitch += this.sensorData.orientation.beta * orientAdjust;
        
        // 최종 범위 재조정
        this.gameInput.roll = this.clamp(this.gameInput.roll, -0.8, 0.8);
        this.gameInput.pitch = this.clamp(this.gameInput.pitch, -0.8, 0.8);
        this.gameInput.yaw = this.clamp(this.gameInput.yaw, -0.8, 0.8);
        this.gameInput.thrust = this.clamp(this.gameInput.thrust, -0.8, 0.8);
        this.gameInput.sideThrust = this.clamp(this.gameInput.sideThrust, -0.8, 0.8);
        this.gameInput.upThrust = this.clamp(this.gameInput.upThrust, -0.8, 0.8);
    }
    
    /**
     * 데이터 히스토리에 추가
     */
    addToHistory(type, data) {
        if (!this.dataHistory[type]) this.dataHistory[type] = [];
        
        this.dataHistory[type].push(data);
        if (this.dataHistory[type].length > this.historySize) {
            this.dataHistory[type].shift();
        }
    }
    
    /**
     * 스무싱된 데이터 계산
     */
    getSmoothedData(type) {
        const history = this.dataHistory[type];
        if (history.length === 0) return { x: 0, y: 0, z: 0 };
        
        const avg = { x: 0, y: 0, z: 0 };
        history.forEach(data => {
            avg.x += data.x;
            avg.y += data.y;
            avg.z += data.z;
        });
        
        return {
            x: avg.x / history.length,
            y: avg.y / history.length,
            z: avg.z / history.length
        };
    }
    
    /**
     * 센서 보정 (현재 값을 기준점으로 설정)
     */
    calibrate() {
        if (this.dataHistory.gyro.length > 0) {
            this.calibration.gyro = this.getSmoothedData('gyro');
        }
        if (this.dataHistory.accel.length > 0) {
            this.calibration.accel = this.getSmoothedData('accel');
        }
        if (this.dataHistory.orient.length > 0) {
            this.calibration.orient = this.getSmoothedData('orient');
        }
        
        console.log('센서 보정 완료', this.calibration);
    }
    
    /**
     * 시뮬레이션 모드 시작 (센서 없이 테스트)
     */
    startSimulationMode() {
        console.log('시뮬레이션 모드 시작');
        this.isConnected = false;
        
        // 마우스/키보드 입력으로 시뮬레이션
        this.setupSimulationControls();
        this.onConnectionChange(false);
    }
    
    /**
     * 시뮬레이션 컨트롤 설정
     */
    setupSimulationControls() {
        let mouseDown = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        document.addEventListener('mousedown', (e) => {
            mouseDown = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            mouseDown = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            
            const deltaX = (e.clientX - lastMouseX) / window.innerWidth;
            const deltaY = (e.clientY - lastMouseY) / window.innerHeight;
            
            this.gameInput.yaw = this.clamp(deltaX * 2, -1, 1);
            this.gameInput.pitch = this.clamp(deltaY * 2, -1, 1);
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            
            // 콜백 호출
            this.callbacks.forEach(callback => callback(this.gameInput, this.sensorData));
        });
        
        // 키보드 입력
        const keys = {};
        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            this.updateSimulationInput(keys);
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.code] = false;
            this.updateSimulationInput(keys);
        });
        
        // 시뮬레이션 업데이트 루프
        setInterval(() => {
            this.updateSimulationInput(keys);
        }, 16); // 60fps
    }
    
    /**
     * 시뮬레이션 입력 업데이트
     */
    updateSimulationInput(keys) {
        // WASD로 추진력 제어
        this.gameInput.thrust = 0;
        this.gameInput.sideThrust = 0;
        this.gameInput.upThrust = 0;
        
        if (keys['KeyW']) this.gameInput.thrust = 1;
        if (keys['KeyS']) this.gameInput.thrust = -1;
        if (keys['KeyA']) this.gameInput.sideThrust = -1;
        if (keys['KeyD']) this.gameInput.sideThrust = 1;
        if (keys['Space']) this.gameInput.upThrust = 1;
        if (keys['ShiftLeft']) this.gameInput.upThrust = -1;
        
        // 화살표로 회전 제어
        this.gameInput.roll = 0;
        if (keys['ArrowLeft']) this.gameInput.roll = -1;
        if (keys['ArrowRight']) this.gameInput.roll = 1;
        
        // 콜백 호출
        this.callbacks.forEach(callback => callback(this.gameInput, this.sensorData));
    }
    
    /**
     * 값 범위 제한
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * 극단적인 값 필터링 (NaN, Infinity 등)
     */
    filterExtreme(value) {
        if (!isFinite(value) || isNaN(value)) {
            return 0;
        }
        // 매우 큰 값도 제한
        if (Math.abs(value) > 100) {
            return 0;
        }
        return value;
    }
    
    /**
     * 연결 상태 변경 콜백
     */
    onConnectionChange(connected) {
        const indicator = document.getElementById('connectionIndicator');
        if (indicator) {
            if (connected) {
                indicator.textContent = '📡 센서 연결됨';
                indicator.style.color = '#00ff00';
            } else {
                indicator.textContent = '📡 센서 연결 안됨 (시뮬레이션 모드)';
                indicator.style.color = '#ffaa00';
            }
        }
    }
    
    /**
     * 센서 데이터 콜백 등록
     */
    onSensorData(callback) {
        this.callbacks.push(callback);
    }
    
    /**
     * 감도 설정
     */
    setSensitivity(type, value) {
        if (this.sensitivity[type] !== undefined) {
            this.sensitivity[type] = value;
        }
    }
    
    /**
     * 현재 게임 입력 값 반환
     */
    getGameInput() {
        return { ...this.gameInput };
    }
    
    /**
     * 원시 센서 데이터 반환
     */
    getRawSensorData() {
        return { ...this.sensorData };
    }
    
    /**
     * 연결 상태 반환
     */
    isConnectedToSensor() {
        return this.isConnected;
    }
}