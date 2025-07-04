/**
 * 볼 굴리기 게임용 센서 매니저
 * 휴대폰 기울기를 감지하여 공의 이동 방향 결정
 */
class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'Ball-Game-' + Math.random().toString(36).substr(2, 9);
        
        // 센서 데이터
        this.sensorData = {
            gyroscope: { x: 0, y: 0, z: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            orientation: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 게임 입력 (기울기 기반)
        this.tiltInput = {
            x: 0,  // 좌우 기울기 (-1 ~ 1)
            y: 0   // 앞뒤 기울기 (-1 ~ 1)
        };
        
        // 센서 보정값
        this.calibration = {
            orientation: { beta: 0, gamma: 0 }
        };
        
        // 데이터 스무싱
        this.dataHistory = {
            orientation: []
        };
        this.historySize = 3;
        
        // 감도 설정 (볼 굴리기에 최적화)
        this.sensitivity = {
            tilt: 0.8,  // 기울기 감도
            deadzone: 2 // 데드존 (도 단위)
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
                console.log('볼 굴리기 게임 센서 연결 성공');
                
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
     * 센서 데이터 처리 및 기울기 입력으로 변환
     */
    processSensorData(data) {
        if (!data.orientation) return;
        
        // 데이터 히스토리에 추가
        this.addToHistory('orientation', data.orientation);
        
        // 스무싱된 데이터 계산
        const smoothedOrientation = this.getSmoothedData('orientation');
        
        // 보정값 적용
        const calibratedBeta = smoothedOrientation.beta - this.calibration.orientation.beta;
        const calibratedGamma = smoothedOrientation.gamma - this.calibration.orientation.gamma;
        
        // 기울기를 게임 입력으로 변환
        this.updateTiltInput(calibratedBeta, calibratedGamma);
        
        // 센서 데이터 저장
        this.sensorData = {
            ...data,
            orientation: {
                ...data.orientation,
                calibratedBeta,
                calibratedGamma
            }
        };
        
        // UI 업데이트
        this.updateUI();
        
        // 콜백 호출
        this.callbacks.forEach(callback => callback(this.tiltInput, this.sensorData));
    }
    
    /**
     * 기울기를 게임 입력으로 변환
     */
    updateTiltInput(beta, gamma) {
        // 데드존 적용
        const deadzone = this.sensitivity.deadzone;
        
        let tiltX = 0;
        let tiltY = 0;
        
        // 좌우 기울기 (gamma: -90 ~ +90도)
        if (Math.abs(gamma) > deadzone) {
            tiltX = gamma / 45.0; // -45~45도를 -1~1로 매핑
            tiltX = this.clamp(tiltX * this.sensitivity.tilt, -1, 1);
        }
        
        // 앞뒤 기울기 (beta: -180 ~ +180도, 하지만 -45~45도만 사용)
        if (Math.abs(beta) > deadzone) {
            tiltY = beta / 45.0; // -45~45도를 -1~1로 매핑
            tiltY = this.clamp(tiltY * this.sensitivity.tilt, -1, 1);
        }
        
        this.tiltInput.x = tiltX;
        this.tiltInput.y = tiltY;
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
        if (history.length === 0) return { alpha: 0, beta: 0, gamma: 0 };
        
        const avg = { alpha: 0, beta: 0, gamma: 0 };
        history.forEach(data => {
            avg.alpha += data.alpha;
            avg.beta += data.beta;
            avg.gamma += data.gamma;
        });
        
        return {
            alpha: avg.alpha / history.length,
            beta: avg.beta / history.length,
            gamma: avg.gamma / history.length
        };
    }
    
    /**
     * 센서 보정 (현재 위치를 중립으로 설정)
     */
    calibrate() {
        if (this.dataHistory.orientation.length > 0) {
            const current = this.getSmoothedData('orientation');
            this.calibration.orientation.beta = current.beta;
            this.calibration.orientation.gamma = current.gamma;
            console.log('센서 보정 완료:', this.calibration.orientation);
        }
    }
    
    /**
     * 시뮬레이션 모드 시작 (센서 없이 테스트)
     */
    startSimulationMode() {
        console.log('시뮬레이션 모드 시작');
        this.isConnected = false;
        this.setupSimulationControls();
        this.onConnectionChange(false);
    }
    
    /**
     * 시뮬레이션 컨트롤 설정 (키보드/마우스)
     */
    setupSimulationControls() {
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
        this.tiltInput.x = 0;
        this.tiltInput.y = 0;
        
        // WASD 또는 화살표 키로 기울기 시뮬레이션
        if (keys['KeyA'] || keys['ArrowLeft']) this.tiltInput.x = -0.5;
        if (keys['KeyD'] || keys['ArrowRight']) this.tiltInput.x = 0.5;
        if (keys['KeyW'] || keys['ArrowUp']) this.tiltInput.y = -0.5;
        if (keys['KeyS'] || keys['ArrowDown']) this.tiltInput.y = 0.5;
        
        // 보정 키 (R)
        if (keys['KeyR']) {
            this.calibrate();
        }
        
        // UI 업데이트
        this.updateUI();
        
        // 콜백 호출
        this.callbacks.forEach(callback => callback(this.tiltInput, this.sensorData));
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        // 기울기 각도 표시
        const tiltXDegrees = this.tiltInput.x * 45; // -45~45도
        const tiltYDegrees = this.tiltInput.y * 45; // -45~45도
        
        document.getElementById('tiltX').textContent = tiltXDegrees.toFixed(1);
        document.getElementById('tiltY').textContent = tiltYDegrees.toFixed(1);
        
        // 기울기 표시기 업데이트
        const tiltDot = document.getElementById('tiltDot');
        if (tiltDot) {
            const maxOffset = 40; // 최대 이동 거리 (픽셀)
            const offsetX = this.tiltInput.x * maxOffset;
            const offsetY = this.tiltInput.y * maxOffset;
            
            tiltDot.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        }
    }
    
    /**
     * 연결 상태 변경 콜백
     */
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
    
    /**
     * 값 범위 제한
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * 센서 데이터 콜백 등록
     */
    onSensorData(callback) {
        this.callbacks.push(callback);
    }
    
    /**
     * 현재 기울기 입력 반환
     */
    getTiltInput() {
        return { ...this.tiltInput };
    }
    
    /**
     * 연결 상태 반환
     */
    isConnectedToSensor() {
        return this.isConnected;
    }
    
    /**
     * 감도 설정
     */
    setSensitivity(tilt, deadzone) {
        this.sensitivity.tilt = tilt;
        this.sensitivity.deadzone = deadzone;
    }
}