/**
 * 센서 매니저 클래스 - 리듬 게임용
 * WebSocket을 통해 모바일 센서 데이터를 수신하고 흔들기 감지
 */
class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'RhythmGame-' + Math.random().toString(36).substr(2, 9);
        
        // 리듬 게임을 위한 입력 데이터
        this.rhythmInput = {
            shake: false,           // 흔들기 감지 여부
            shakeIntensity: 0,      // 흔들기 강도 (0-1)
            tilt: { x: 0, y: 0 }    // 기울기 (메뉴 네비게이션용)
        };
        
        // 센서 원시 데이터
        this.sensorData = {
            gyroscope: { x: 0, y: 0, z: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            orientation: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 하향 동작 감지 설정 (극도로 민감하게 조정)
        this.downwardMotion = {
            threshold: 1.5,         // 하향 가속도 임계값 (2→1.5로 더 낮춤)
            cooldown: 150,          // 연속 동작 방지 (ms) - 더 빠른 반응
            lastActionTime: 0,      // 마지막 동작 시간
            sensitivity: 4.0,       // 감도 배율 (3.0→4.0으로 더 증가)
            minDistance: 2,         // 최소 이동 거리 (3→2로 더 낮춤)
            isInDownwardMotion: false,  // 현재 하향 동작 중인지
            peakAcceleration: 0     // 최대 가속도 (동작 감지용)
        };
        
        // 데이터 스무딩
        this.smoothingBuffer = {
            accelerometer: [],
            bufferSize: 3
        };
        
        // 콜백 함수들
        this.callbacks = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        
        // 시뮬레이션 모드
        this.simulationMode = false;
        
        this.init();
    }
    
    /**
     * 센서 매니저 초기화
     */
    init() {
        this.connectToServer();
        this.setupSimulationMode();
        this.updateUI();
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
                this.reconnectAttempts = 0;
                console.log('리듬 게임 센서 연결 성공');
                this.updateConnectionStatus(true);
                
                // 게임 클라이언트로 등록
                this.socket.send(JSON.stringify({
                    type: 'game_client_register',
                    deviceId: this.deviceId,
                    gameType: 'rhythm-game',
                    timestamp: Date.now()
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
                console.log('센서 연결 끊김');
                this.updateConnectionStatus(false);
                this.attemptReconnect();
            };
            
            this.socket.onerror = (error) => {
                console.error('센서 연결 오류:', error);
                this.isConnected = false;
                this.updateConnectionStatus(false);
            };
            
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
            this.attemptReconnect();
        }
    }
    
    /**
     * 재연결 시도
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connectToServer();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.log('재연결 시도 횟수 초과, 시뮬레이션 모드로 전환');
            this.startSimulationMode();
        }
    }
    
    /**
     * 센서 데이터 처리
     */
    processSensorData(data) {
        // 원시 센서 데이터 저장
        this.sensorData = {
            gyroscope: data.gyroscope || { x: 0, y: 0, z: 0 },
            accelerometer: data.accelerometer || { x: 0, y: 0, z: 0 },
            orientation: data.orientation || { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 데이터 수신 확인 로그 (5초마다)
        if (!this.lastDataLogTime || Date.now() - this.lastDataLogTime > 5000) {
            console.log('센서 데이터 수신 중:', this.sensorData.accelerometer);
            this.lastDataLogTime = Date.now();
        }
        
        // 데이터 스무딩
        const smoothedData = this.smoothData(this.sensorData);
        
        // 기울기 계산 (메뉴 네비게이션용)
        this.rhythmInput.tilt = {
            x: Math.max(-1, Math.min(1, smoothedData.orientation.gamma / 45)),
            y: Math.max(-1, Math.min(1, smoothedData.orientation.beta / 45))
        };
        
        // 하향 동작 감지
        this.detectDownwardMotion(smoothedData.accelerometer);
        
        // UI 업데이트
        this.updateSensorDisplay();
        
        // 콜백 함수들 호출
        this.callbacks.forEach(callback => {
            try {
                callback(this.rhythmInput, this.sensorData);
            } catch (error) {
                console.error('센서 콜백 오류:', error);
            }
        });
    }
    
    /**
     * 하향 동작 감지 (핸드폰을 위에서 아래로 휙 내릴 때)
     */
    detectDownwardMotion(accelerometer) {
        const currentTime = Date.now();
        
        // 쿨다운 체크
        if (currentTime - this.downwardMotion.lastActionTime < this.downwardMotion.cooldown) {
            return;
        }
        
        // Y축 가속도 (위아래 방향) - 음수가 아래쪽
        const yAcceleration = accelerometer.y;
        
        // 하향 가속도 강도 계산 (중력 보정)
        const downwardForce = -(yAcceleration + 9.8); // 중력 제거 후 하향 힘
        
        // 하향 동작 감지 로직
        if (downwardForce > this.downwardMotion.threshold) {
            // 하향 동작 시작
            if (!this.downwardMotion.isInDownwardMotion) {
                this.downwardMotion.isInDownwardMotion = true;
                this.downwardMotion.peakAcceleration = downwardForce;
                console.log('하향 동작 시작, 가속도:', downwardForce.toFixed(2));
            } else {
                // 최대 가속도 업데이트
                if (downwardForce > this.downwardMotion.peakAcceleration) {
                    this.downwardMotion.peakAcceleration = downwardForce;
                }
            }
        } else if (this.downwardMotion.isInDownwardMotion && downwardForce < 0.5) {
            // 하향 동작 완료 (가속도가 줄어들 때 - 매우 민감하게)
            console.log('하향 동작 완료! 최대 가속도:', this.downwardMotion.peakAcceleration.toFixed(2));
            
            // 충분한 강도로 내려쳤는지 확인 (임계값 더 낮춤)
            if (this.downwardMotion.peakAcceleration > this.downwardMotion.minDistance) {
                // 성공적인 하향 동작
                this.rhythmInput.shake = true;
                this.rhythmInput.shakeIntensity = Math.min(1, 
                    this.downwardMotion.peakAcceleration / 10 * this.downwardMotion.sensitivity  // 30→10으로 변경
                );
                
                this.downwardMotion.lastActionTime = currentTime;
                
                // 하향 동작 이벤트 발생
                this.dispatchDownwardMotionEvent(this.rhythmInput.shakeIntensity);
                
                console.log('하향 동작 인식! 강도:', this.rhythmInput.shakeIntensity.toFixed(2));
                
                // 일정 시간 후 플래그 리셋
                setTimeout(() => {
                    this.rhythmInput.shake = false;
                    this.rhythmInput.shakeIntensity = 0;
                }, 100);
            }
            
            // 하향 동작 상태 리셋
            this.downwardMotion.isInDownwardMotion = false;
            this.downwardMotion.peakAcceleration = 0;
        }
        
        // UI 표시용 현재 강도 업데이트 (더 민감하게)
        if (this.downwardMotion.isInDownwardMotion) {
            this.rhythmInput.shakeIntensity = Math.min(1, 
                this.downwardMotion.peakAcceleration / 8 * this.downwardMotion.sensitivity
            );
        } else if (!this.rhythmInput.shake) {
            this.rhythmInput.shakeIntensity = Math.max(0, this.rhythmInput.shakeIntensity - 0.05); // 부드러운 감소
        }
        
        // 실시간 디버깅을 위한 로그 (더 민감하게)
        if (downwardForce > 1) {
            console.log('Y 가속도:', yAcceleration.toFixed(2), '하향 힘:', downwardForce.toFixed(2), 'UI 강도:', this.rhythmInput.shakeIntensity.toFixed(2));
        }
    }
    
    /**
     * 데이터 스무딩
     */
    smoothData(rawData) {
        // 가속도계 스무딩
        this.smoothingBuffer.accelerometer.push(rawData.accelerometer);
        if (this.smoothingBuffer.accelerometer.length > this.smoothingBuffer.bufferSize) {
            this.smoothingBuffer.accelerometer.shift();
        }
        
        const smoothedAccel = this.calculateAverage(this.smoothingBuffer.accelerometer);
        
        return {
            gyroscope: rawData.gyroscope,
            accelerometer: smoothedAccel,
            orientation: rawData.orientation
        };
    }
    
    /**
     * 평균값 계산
     */
    calculateAverage(dataArray) {
        if (dataArray.length === 0) return { x: 0, y: 0, z: 0 };
        
        const sum = dataArray.reduce((acc, data) => ({
            x: acc.x + data.x,
            y: acc.y + data.y,
            z: acc.z + data.z
        }), { x: 0, y: 0, z: 0 });
        
        return {
            x: sum.x / dataArray.length,
            y: sum.y / dataArray.length,
            z: sum.z / dataArray.length
        };
    }
    
    /**
     * 시뮬레이션 모드 설정
     */
    setupSimulationMode() {
        document.addEventListener('keydown', (event) => {
            if (!this.simulationMode) return;
            
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    // 스페이스바로 하향 동작 시뮬레이션
                    this.simulateShake();
                    break;
                    
                case 'ArrowLeft':
                case 'KeyA':
                    this.rhythmInput.tilt.x = -1;
                    break;
                    
                case 'ArrowRight':
                case 'KeyD':
                    this.rhythmInput.tilt.x = 1;
                    break;
                    
                case 'ArrowUp':
                case 'KeyW':
                    this.rhythmInput.tilt.y = -1;
                    break;
                    
                case 'ArrowDown':
                case 'KeyS':
                    this.rhythmInput.tilt.y = 1;
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (!this.simulationMode) return;
            
            switch (event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                case 'ArrowRight':
                case 'KeyD':
                    this.rhythmInput.tilt.x = 0;
                    break;
                    
                case 'ArrowUp':
                case 'KeyW':
                case 'ArrowDown':
                case 'KeyS':
                    this.rhythmInput.tilt.y = 0;
                    break;
            }
        });
    }
    
    /**
     * 하향 동작 시뮬레이션 (스페이스바)
     */
    simulateShake() {
        console.log('하향 동작 시뮬레이션 실행');
        
        // 강도를 점진적으로 증가시켜 실제 동작과 유사하게
        this.rhythmInput.shake = true;
        this.rhythmInput.shakeIntensity = 0.0;
        
        let intensity = 0;
        const increaseInterval = setInterval(() => {
            intensity += 0.2;
            this.rhythmInput.shakeIntensity = Math.min(1.0, intensity);
            
            if (intensity >= 0.8) {
                clearInterval(increaseInterval);
                
                // 피크에 도달하면 이벤트 발생
                this.dispatchDownwardMotionEvent(this.rhythmInput.shakeIntensity);
                
                // 점진적으로 감소
                setTimeout(() => {
                    const decreaseInterval = setInterval(() => {
                        this.rhythmInput.shakeIntensity = Math.max(0, this.rhythmInput.shakeIntensity - 0.1);
                        
                        if (this.rhythmInput.shakeIntensity <= 0) {
                            clearInterval(decreaseInterval);
                            this.rhythmInput.shake = false;
                        }
                    }, 50);
                }, 100);
            }
        }, 50);
    }
    
    /**
     * 시뮬레이션 모드 시작
     */
    startSimulationMode() {
        this.simulationMode = true;
        console.log('하향 동작 시뮬레이션 모드 활성화 (스페이스바 = 휙 내리기)');
        
        // 시뮬레이션 모드 UI 표시
        const simulationUI = document.getElementById('simulationMode');
        if (simulationUI) {
            simulationUI.style.display = 'block';
        }
        
        this.updateConnectionStatus(false, '하향 동작 시뮬레이션');
    }
    
    /**
     * 하향 동작 이벤트 발생
     */
    dispatchDownwardMotionEvent(intensity) {
        const motionEvent = new CustomEvent('rhythmShake', {
            detail: {
                intensity: intensity,
                timestamp: Date.now(),
                type: 'downward_motion'
            }
        });
        document.dispatchEvent(motionEvent);
    }
    
    /**
     * 흔들기 이벤트 발생 (호환성 유지)
     */
    dispatchShakeEvent(intensity) {
        this.dispatchDownwardMotionEvent(intensity);
    }
    
    /**
     * 연결 상태 UI 업데이트
     */
    updateConnectionStatus(connected, message = null) {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        
        if (statusDot && statusText) {
            if (connected) {
                statusDot.classList.add('connected');
                statusText.textContent = '센서 연결됨';
            } else {
                statusDot.classList.remove('connected');
                statusText.textContent = message || 
                    (this.reconnectAttempts > 0 ? 
                        `재연결 시도 중... (${this.reconnectAttempts}/${this.maxReconnectAttempts})` : 
                        '센서 연결 대기 중');
            }
        }
    }
    
    /**
     * 센서 데이터 표시 업데이트
     */
    updateSensorDisplay() {
        const shakeIntensityElement = document.getElementById('shakeIntensity');
        if (shakeIntensityElement) {
            shakeIntensityElement.textContent = this.rhythmInput.shakeIntensity.toFixed(2);
        }
    }
    
    /**
     * UI 요소 업데이트
     */
    updateUI() {
        this.updateConnectionStatus(this.isConnected);
        this.updateSensorDisplay();
    }
    
    /**
     * 센서 데이터 콜백 등록 (별칭)
     */
    onSensorData(callback) {
        this.addCallback(callback);
    }
    
    /**
     * 센서 데이터 콜백 등록
     */
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    
    /**
     * 현재 리듬 입력 데이터 반환
     */
    getRhythmInput() {
        return { ...this.rhythmInput };
    }
    
    /**
     * 센서 감도 설정
     */
    setSensitivity(sensitivity) {
        this.downwardMotion.sensitivity = Math.max(0.1, Math.min(5.0, sensitivity));
    }
    
    /**
     * 하향 동작 임계값 설정
     */
    setDownwardThreshold(threshold) {
        this.downwardMotion.threshold = Math.max(5, Math.min(30, threshold));
    }
    
    /**
     * 연결 상태 확인
     */
    isConnectedToSensor() {
        return this.isConnected;
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.callbacks = [];
        this.rhythmInput = { shake: false, shakeIntensity: 0, tilt: { x: 0, y: 0 } };
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.SensorManager = SensorManager;
}