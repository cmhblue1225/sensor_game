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
        
        // 감도 설정 (중력가속도 고려 조정)
        this.sensitivity = {
            gyro: 3.0,     // 5.0 → 3.0 (적절한 수준)
            accel: 0.3,    // 8.0 → 0.3 (중력가속도 9.8 고려 대폭 감소)
            orient: 0.02   // 0.5 → 0.02 (미세조정용으로 감소)
        };
        
        console.log('센서 감도 설정:', this.sensitivity);
        
        // 센서 안정화 변수
        this.isStabilized = false;
        this.stabilizationCounter = 0;
        
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
                
                // 센서 안정화 리셋
                this.isStabilized = false;
                this.stabilizationCounter = 0;
                
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
        console.log('=== 센서 데이터 수신 ===');
        console.log('원시 데이터:', data);
        
        // 데이터 유효성 먼저 확인
        if (!data || !data.gyroscope || !data.accelerometer || !data.orientation) {
            console.error('센서 데이터가 불완전합니다:', data);
            return;
        }
        
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
        
        console.log('스무싱된 데이터:', smoothedData);
        
        // 보정값 적용 (임시 비활성화 - 테스트용)
        this.sensorData = {
            gyroscope: {
                x: smoothedData.gyroscope.x, // 보정 비활성화
                y: smoothedData.gyroscope.y,
                z: smoothedData.gyroscope.z
            },
            accelerometer: {
                x: smoothedData.accelerometer.x, // 보정 비활성화
                y: smoothedData.accelerometer.y,
                z: smoothedData.accelerometer.z
            },
            orientation: {
                alpha: smoothedData.orientation.alpha, // 보정 비활성화
                beta: smoothedData.orientation.beta,
                gamma: smoothedData.orientation.gamma
            }
        };
        
        console.log('처리된 센서 데이터:', this.sensorData);
        
        // 게임 입력으로 변환
        this.updateGameInput();
        
        // 콜백 호출
        this.callbacks.forEach(callback => callback(this.gameInput, this.sensorData));
    }
    
    /**
     * 센서 데이터를 게임 입력으로 변환
     */
    updateGameInput() {
        // 센서 데이터 유효성 검사 강화
        if (!this.sensorData.gyroscope || !this.sensorData.accelerometer || !this.sensorData.orientation) {
            console.warn('센서 데이터가 없습니다');
            this.setDefaultGameInput();
            return;
        }
        
        // NaN 값 검사 및 필터링
        if (!this.isValidSensorData(this.sensorData)) {
            console.warn('센서 데이터 무효 - 기본값 사용');
            this.setDefaultGameInput();
            return;
        }
        
        // 초기화 시 잠깐 대기 (센서 안정화) - 테스트용 완전 비활성화
        if (!this.isStabilized) {
            this.stabilizationCounter = (this.stabilizationCounter || 0) + 1;
            console.log('안정화 카운터:', this.stabilizationCounter);
            // 안정화 대기 완전 제거 - 즉시 처리
            this.isStabilized = true;
            console.log('센서 안정화 즉시 완료!');
        }
        
        // 자이로스코프 → 회전 속도 (직관적 매핑)
        // 휴대폰 회전 = 우주선 회전으로 직관적 매핑
        let roll = this.safeMultiply(this.sensorData.gyroscope.z, this.sensitivity.gyro);   // Z축 회전 = 롤
        let pitch = this.safeMultiply(-this.sensorData.gyroscope.x, this.sensitivity.gyro); // X축 회전 = 피치 (반전)
        let yaw = this.safeMultiply(this.sensorData.gyroscope.y, this.sensitivity.gyro);    // Y축 회전 = 요
        
        // 극단적인 값 필터링 및 NaN 처리
        roll = this.filterExtreme(roll);
        pitch = this.filterExtreme(pitch);
        yaw = this.filterExtreme(yaw);
        
        this.gameInput.roll = this.clamp(roll, -1.0, 1.0); // 범위 확장
        this.gameInput.pitch = this.clamp(pitch, -1.0, 1.0);
        this.gameInput.yaw = this.clamp(yaw, -1.0, 1.0);
        
        // 가속도계 → 추진력 (중력가속도 배제 및 직관적 매핑)
        // 중력가속도(~9.8) 배제
        const accelWithoutGravity = {
            x: this.sensorData.accelerometer.x,
            y: this.sensorData.accelerometer.y,
            z: this.sensorData.accelerometer.z + 9.8 // 중력 배제
        };
        
        // 직관적 매핑: 휴대폰 기울임 = 우주선 이동
        let thrust = this.safeMultiply(accelWithoutGravity.y, this.sensitivity.accel);     // 앞뒤 기울임 = 전진/후진
        let sideThrust = this.safeMultiply(accelWithoutGravity.x, this.sensitivity.accel);  // 좌우 기울임 = 좌우 이동
        let upThrust = this.safeMultiply(-accelWithoutGravity.z, this.sensitivity.accel);   // 상하 기울임 = 상하 이동
        
        // 극단적인 값 필터링 및 NaN 처리
        thrust = this.filterExtreme(thrust);
        sideThrust = this.filterExtreme(sideThrust);
        upThrust = this.filterExtreme(upThrust);
        
        this.gameInput.thrust = this.clamp(thrust, -1.0, 1.0); // 범위 확장
        this.gameInput.sideThrust = this.clamp(sideThrust, -1.0, 1.0);
        this.gameInput.upThrust = this.clamp(upThrust, -1.0, 1.0);
        
        // 방향 센서로 미세 조정 (안전한 방식으로)
        const orientAdjust = 0.03;
        const gammaAdjust = this.safeMultiply(this.sensorData.orientation.gamma, orientAdjust);
        const betaAdjust = this.safeMultiply(this.sensorData.orientation.beta, orientAdjust);
        
        this.gameInput.roll = this.safeAdd(this.gameInput.roll, gammaAdjust);
        this.gameInput.pitch = this.safeAdd(this.gameInput.pitch, betaAdjust);
        
        // 최종 범위 재조정 (반응성 우선)
        this.gameInput.roll = this.clamp(this.gameInput.roll, -1.0, 1.0);
        this.gameInput.pitch = this.clamp(this.gameInput.pitch, -1.0, 1.0);
        this.gameInput.yaw = this.clamp(this.gameInput.yaw, -1.0, 1.0);
        this.gameInput.thrust = this.clamp(this.gameInput.thrust, -1.0, 1.0);
        this.gameInput.sideThrust = this.clamp(this.gameInput.sideThrust, -1.0, 1.0);
        this.gameInput.upThrust = this.clamp(this.gameInput.upThrust, -1.0, 1.0);
        
        // 최종 게임 입력 로그 (필요시 활성화)
        // console.log('최종 게임 입력:', this.gameInput);
    }
    
    /**
     * 데이터 히스토리에 추가 (유효성 검증 추가)
     */
    addToHistory(type, data) {
        if (!this.dataHistory[type]) this.dataHistory[type] = [];
        
        // 유효한 데이터만 히스토리에 추가
        if (type === 'orient') {
            if (this.isValidOrientation(data)) {
                this.dataHistory[type].push(data);
            }
        } else {
            if (this.isValidVector(data)) {
                this.dataHistory[type].push(data);
            }
        }
        
        if (this.dataHistory[type].length > this.historySize) {
            this.dataHistory[type].shift();
        }
    }
    
    /**
     * 스무싱된 데이터 계산 (방향센서 지원 추가)
     */
    getSmoothedData(type) {
        const history = this.dataHistory[type];
        if (!history || history.length === 0) {
            if (type === 'orient') {
                return { alpha: 0, beta: 0, gamma: 0 };
            }
            return { x: 0, y: 0, z: 0 };
        }
        
        if (type === 'orient') {
            // 방향센서 데이터 처리
            const avg = { alpha: 0, beta: 0, gamma: 0 };
            let validCount = 0;
            
            history.forEach(data => {
                if (data && this.isValidOrientation(data)) {
                    avg.alpha += data.alpha;
                    avg.beta += data.beta;
                    avg.gamma += data.gamma;
                    validCount++;
                }
            });
            
            if (validCount === 0) {
                return { alpha: 0, beta: 0, gamma: 0 };
            }
            
            return {
                alpha: avg.alpha / validCount,
                beta: avg.beta / validCount,
                gamma: avg.gamma / validCount
            };
        } else {
            // 벡터 데이터 처리 (자이로/가속도)
            const avg = { x: 0, y: 0, z: 0 };
            let validCount = 0;
            
            history.forEach(data => {
                if (data && this.isValidVector(data)) {
                    avg.x += data.x;
                    avg.y += data.y;
                    avg.z += data.z;
                    validCount++;
                }
            });
            
            if (validCount === 0) {
                return { x: 0, y: 0, z: 0 };
            }
            
            return {
                x: avg.x / validCount,
                y: avg.y / validCount,
                z: avg.z / validCount
            };
        }
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
     * 극단적인 값 필터링 (NaN, Infinity 등) - 강화된 버전
     */
    filterExtreme(value) {
        // 기본값 처리
        if (value === undefined || value === null) {
            return 0;
        }
        
        // NaN 및 Infinity 처리
        if (!isFinite(value) || isNaN(value)) {
            console.warn('극단값 필터링:', value);
            return 0;
        }
        
        // 매우 큰 값도 제한 (합리적 범위)
        if (Math.abs(value) > 5) {
            console.warn('값이 너무 큽니다:', value);
            return Math.sign(value) * 5;
        }
        
        return value;
    }
    
    /**
     * 안전한 곱셈 연산
     */
    safeMultiply(a, b) {
        if (a === undefined || a === null || b === undefined || b === null) {
            return 0;
        }
        if (!isFinite(a) || isNaN(a) || !isFinite(b) || isNaN(b)) {
            return 0;
        }
        return a * b;
    }
    
    /**
     * 안전한 덧셈 연산
     */
    safeAdd(a, b) {
        if (a === undefined || a === null) a = 0;
        if (b === undefined || b === null) b = 0;
        if (!isFinite(a) || isNaN(a)) a = 0;
        if (!isFinite(b) || isNaN(b)) b = 0;
        return a + b;
    }
    
    /**
     * 센서 데이터 유효성 검사 (방향센서 선택적)
     */
    isValidSensorData(data) {
        if (!data || !data.gyroscope || !data.accelerometer) {
            console.log('기본 센서 데이터 누락');
            return false;
        }
        
        // 자이로스코프 검사 (필수)
        if (!this.isValidVector(data.gyroscope)) {
            console.log('자이로스코프 데이터 무효');
            return false;
        }
        
        // 가속도계 검사 (필수)
        if (!this.isValidVector(data.accelerometer)) {
            console.log('가속도계 데이터 무효');
            return false;
        }
        
        // 방향 센서는 선택적 - undefined여도 게임 진행 가능
        if (data.orientation && !this.isValidOrientation(data.orientation)) {
            console.log('방향센서 데이터가 있지만 무효 - 방향센서 무시하고 진행');
            // 방향센서를 0으로 설정
            data.orientation = { alpha: 0, beta: 0, gamma: 0 };
        } else if (!data.orientation) {
            console.log('방향센서 데이터 없음 - 기본값으로 설정');
            data.orientation = { alpha: 0, beta: 0, gamma: 0 };
        }
        
        return true;
    }
    
    /**
     * 벡터 데이터 유효성 검사
     */
    isValidVector(vector) {
        if (!vector) {
            return false;
        }
        
        return isFinite(vector.x) && !isNaN(vector.x) &&
               isFinite(vector.y) && !isNaN(vector.y) &&
               isFinite(vector.z) && !isNaN(vector.z);
    }
    
    /**
     * 방향 데이터 유효성 검사
     */
    isValidOrientation(orientation) {
        if (!orientation) {
            return false;
        }
        
        return isFinite(orientation.alpha) && !isNaN(orientation.alpha) &&
               isFinite(orientation.beta) && !isNaN(orientation.beta) &&
               isFinite(orientation.gamma) && !isNaN(orientation.gamma);
    }
    
    /**
     * 기본 게임 입력값 설정
     */
    setDefaultGameInput() {
        this.gameInput = {
            roll: 0,
            pitch: 0,
            yaw: 0,
            thrust: 0,
            sideThrust: 0,
            upThrust: 0
        };
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