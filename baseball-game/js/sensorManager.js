/**
 * 센서 매니저 클래스
 * 야구 게임용 센서 데이터 처리
 */

class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'Baseball-Game-' + Math.random().toString(36).substr(2, 9);
        
        this.sensorData = {
            gyroscope: { x: 0, y: 0, z: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            orientation: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 배트 스윙을 위한 데이터
        this.swingData = {
            x: 0,  // 좌우 기울기
            y: 0,  // 앞뒤 기울기
            z: 0,  // 회전
            power: 0  // 스윙 파워
        };
        
        // 센서 보정값
        this.calibration = {
            gyroscope: { x: 0, y: 0, z: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            orientation: { beta: 0, gamma: 0 }
        };
        
        // 데이터 스무싱을 위한 버퍼
        this.dataBuffer = {
            gyroscope: [],
            accelerometer: [],
            orientation: []
        };
        this.bufferSize = 3;
        
        // 연결 설정
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        
        // 감도 설정 (야구 배트 스윙에 최적화)
        this.sensitivity = {
            swing: 3.0,     // 스윙 감도 (1.2 → 3.0으로 증가)
            rotation: 2.5,  // 회전 감도 (0.8 → 2.5로 증가)
            deadzone: 0.5   // 데드존 (1 → 0.5로 감소)
        };
        
        this.callbacks = [];
        this.init();
    }
    
    /**
     * 센서 매니저 초기화
     */
    init() {
        this.connectToServer();
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
                console.log('야구 게임 센서 연결 성공');
                this.updateConnectionStatus(true);
                
                // 게임 클라이언트로 등록
                this.socket.send(JSON.stringify({
                    type: 'game_client_register',
                    deviceId: this.deviceId,
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
            this.enableSimulationMode();
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
        
        // 보정 적용
        const calibratedData = this.applyCalibraion(this.sensorData);
        
        // 데이터 스무싱
        const smoothedData = this.smoothData(calibratedData);
        
        // 배트 스윙 데이터 계산
        this.calculateSwingData(smoothedData);
        
        // UI 업데이트
        this.updateSensorDisplay();
        
        // 센서 업데이트 이벤트 발생
        this.dispatchSensorUpdate();
        
        // 콜백 함수들 호출
        this.callbacks.forEach(callback => {
            try {
                callback(this.swingData);
            } catch (error) {
                console.error('센서 콜백 오류:', error);
            }
        });
    }
    
    /**
     * 배트 스윙 데이터 계산
     */
    calculateSwingData(data) {
        // 기울기를 배트 위치로 변환 (더 직관적으로)
        // gamma: 좌우 기울이기 (양수=우측, 음수=좌측)
        // beta: 앞뒤 기울이기 (양수=앞으로, 음수=뒤로)
        // gyroscope.z: 회전 (시계방향/반시계방향)
        
        let x = (data.orientation.gamma - this.calibration.orientation.gamma) * this.sensitivity.swing;
        let y = (data.orientation.beta - this.calibration.orientation.beta) * this.sensitivity.swing;
        let z = data.gyroscope.z * this.sensitivity.rotation;
        
        // 데드존 적용 (더 작게)
        if (Math.abs(x) < this.sensitivity.deadzone) x = 0;
        if (Math.abs(y) < this.sensitivity.deadzone) y = 0;
        if (Math.abs(z) < this.sensitivity.deadzone) z = 0;
        
        // 범위 제한 (-1 ~ 1) - 더 작은 각도에서도 반응하도록 수정
        x = Math.max(-1, Math.min(1, x / 10)); // 15도 → 10도로 더 민감하게
        y = Math.max(-1, Math.min(1, y / 10)); // 15도 → 10도로 더 민감하게  
        z = Math.max(-1, Math.min(1, z / 30)); // 60도/초 → 30도/초로 더 민감하게
        
        // 스윙 파워 계산 (가속도계 기반) - 더 민감하게
        const accelMagnitude = Math.sqrt(
            data.accelerometer.x * data.accelerometer.x +
            data.accelerometer.y * data.accelerometer.y +
            data.accelerometer.z * data.accelerometer.z
        );
        
        // 중력(9.8) 제외한 실제 가속도
        const actualAccel = Math.max(0, accelMagnitude - 9.8);
        const power = Math.min(1, actualAccel / 5); // 10m/s² → 5m/s²로 더 민감하게
        
        this.swingData = { x, y, z, power };
    }
    
    /**
     * 센서 보정 적용
     */
    applyCalibraion(rawData) {
        return {
            gyroscope: {
                x: rawData.gyroscope.x - this.calibration.gyroscope.x,
                y: rawData.gyroscope.y - this.calibration.gyroscope.y,
                z: rawData.gyroscope.z - this.calibration.gyroscope.z
            },
            accelerometer: {
                x: rawData.accelerometer.x - this.calibration.accelerometer.x,
                y: rawData.accelerometer.y - this.calibration.accelerometer.y,
                z: rawData.accelerometer.z - this.calibration.accelerometer.z
            },
            orientation: {
                alpha: rawData.orientation.alpha,
                beta: rawData.orientation.beta - this.calibration.orientation.beta,
                gamma: rawData.orientation.gamma - this.calibration.orientation.gamma
            }
        };
    }
    
    /**
     * 데이터 스무싱 (이동평균)
     */
    smoothData(data) {
        // 자이로스코프 스무싱
        this.dataBuffer.gyroscope.push(data.gyroscope);
        if (this.dataBuffer.gyroscope.length > this.bufferSize) {
            this.dataBuffer.gyroscope.shift();
        }
        
        // 가속도계 스무싱
        this.dataBuffer.accelerometer.push(data.accelerometer);
        if (this.dataBuffer.accelerometer.length > this.bufferSize) {
            this.dataBuffer.accelerometer.shift();
        }
        
        // 방향 스무싱
        this.dataBuffer.orientation.push(data.orientation);
        if (this.dataBuffer.orientation.length > this.bufferSize) {
            this.dataBuffer.orientation.shift();
        }
        
        // 평균 계산
        const smoothedGyro = this.calculateAverage(this.dataBuffer.gyroscope);
        const smoothedAccel = this.calculateAverage(this.dataBuffer.accelerometer);
        const smoothedOrientation = this.calculateOrientationAverage(this.dataBuffer.orientation);
        
        return {
            gyroscope: smoothedGyro,
            accelerometer: smoothedAccel,
            orientation: smoothedOrientation
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
     * 방향 데이터 평균값 계산
     */
    calculateOrientationAverage(dataArray) {
        if (dataArray.length === 0) return { alpha: 0, beta: 0, gamma: 0 };
        
        const sum = dataArray.reduce((acc, data) => ({
            alpha: acc.alpha + data.alpha,
            beta: acc.beta + data.beta,
            gamma: acc.gamma + data.gamma
        }), { alpha: 0, beta: 0, gamma: 0 });
        
        return {
            alpha: sum.alpha / dataArray.length,
            beta: sum.beta / dataArray.length,
            gamma: sum.gamma / dataArray.length
        };
    }
    
    /**
     * 센서 보정
     */
    calibrate() {
        if (!this.isConnected) {
            console.log('센서가 연결되지 않아 보정할 수 없습니다');
            return;
        }
        
        console.log('센서 보정 시작...');
        
        // 현재 센서 값을 보정 기준으로 설정
        this.calibration.gyroscope = { ...this.sensorData.gyroscope };
        this.calibration.accelerometer = { 
            x: this.sensorData.accelerometer.x,
            y: this.sensorData.accelerometer.y,
            z: this.sensorData.accelerometer.z - 9.8 // 중력 보정
        };
        this.calibration.orientation = {
            beta: this.sensorData.orientation.beta,
            gamma: this.sensorData.orientation.gamma
        };
        
        // 데이터 버퍼 초기화
        this.dataBuffer.gyroscope = [];
        this.dataBuffer.accelerometer = [];
        this.dataBuffer.orientation = [];
        
        console.log('센서 보정 완료');
        
        // 보정 완료 피드백
        this.showCalibrationFeedback();
    }
    
    /**
     * 보정 완료 피드백 표시
     */
    showCalibrationFeedback() {
        const feedback = document.getElementById('hitFeedback');
        if (feedback) {
            feedback.textContent = '센서 보정 완료!';
            feedback.className = 'feedback-popup show hit';
            
            setTimeout(() => {
                feedback.classList.remove('show');
            }, 2000);
        }
    }
    
    /**
     * 시뮬레이션 모드 활성화
     */
    enableSimulationMode() {
        console.log('시뮬레이션 모드 활성화');
        
        // 시뮬레이션 모드 이벤트 발생
        const simulationEvent = new CustomEvent('simulationModeEnabled');
        document.dispatchEvent(simulationEvent);
    }
    
    /**
     * 센서 업데이트 이벤트 발생
     */
    dispatchSensorUpdate() {
        const sensorEvent = new CustomEvent('sensorUpdate', {
            detail: {
                swingData: this.swingData,
                rawData: this.sensorData,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(sensorEvent);
    }
    
    /**
     * 연결 상태 UI 업데이트
     */
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        
        if (statusDot && statusText) {
            if (connected) {
                statusDot.classList.add('connected');
                statusText.textContent = '센서 연결됨';
            } else {
                statusDot.classList.remove('connected');
                statusText.textContent = this.reconnectAttempts > 0 ? 
                    `재연결 시도 중... (${this.reconnectAttempts}/${this.maxReconnectAttempts})` : 
                    '센서 연결 대기 중';
            }
        }
    }
    
    /**
     * 센서 데이터 표시 업데이트
     */
    updateSensorDisplay() {
        const sensorX = document.getElementById('sensorX');
        const sensorY = document.getElementById('sensorY');
        const sensorZ = document.getElementById('sensorZ');
        
        if (sensorX && sensorY && sensorZ) {
            sensorX.textContent = this.swingData.x.toFixed(2);
            sensorY.textContent = this.swingData.y.toFixed(2);
            sensorZ.textContent = this.swingData.z.toFixed(2);
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
     * 센서 데이터 콜백 등록
     */
    onSensorData(callback) {
        this.callbacks.push(callback);
    }
    
    /**
     * 연결 상태 변경 콜백
     */
    onConnectionChange(connected) {
        console.log(connected ? '센서 연결됨' : '센서 연결 끊김');
        
        // 시뮬레이션 모드 안내 표시/숨김
        const simulationMode = document.getElementById('simulationMode');
        if (simulationMode) {
            simulationMode.style.display = connected ? 'none' : 'block';
        }
    }
    
    /**
     * 현재 센서 데이터 반환
     */
    getSensorData() {
        return { ...this.sensorData };
    }
    
    /**
     * 현재 스윙 데이터 반환
     */
    getSwingData() {
        return { ...this.swingData };
    }
    
    /**
     * 연결 상태 반환
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
        this.sensorData = {
            gyroscope: { x: 0, y: 0, z: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            orientation: { alpha: 0, beta: 0, gamma: 0 }
        };
        this.swingData = { x: 0, y: 0, z: 0, power: 0 };
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.SensorManager = SensorManager;
}