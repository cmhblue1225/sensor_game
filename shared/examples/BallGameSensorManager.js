/**
 * 센서 게임 플랫폼 - 볼 굴리기 게임용 센서 관리자
 * BaseSensorManager를 상속받아 볼 굴리기 게임에 특화된 센서 처리 구현
 * 
 * 사용법:
 * 1. shared 폴더의 파일들을 HTML에 로드
 * 2. 이 파일을 game/js/ 폴더에 복사
 * 3. 기존 sensorManager.js를 이 파일로 교체
 */

// BaseSensorManager 상속받아 구현
class BallGameSensorManager extends BaseSensorManager {
    constructor() {
        super('ball-rolling', 'BallGame');
        
        // 볼 굴리기 게임 전용 입력 구조
        this.gameInput = {
            x: 0,  // 좌우 기울기 (-1 ~ 1)
            y: 0,  // 앞뒤 기울기 (-1 ~ 1)
            speed: 0, // 현재 기울기 강도 (0 ~ 1)
            brake: 0  // 브레이크 입력 (0 ~ 1)
        };
        
        // 게임별 설정 로드
        this.config = GameConfig.getGameConfig('ball-rolling');
        this.sensorConfig = this.config.sensor;
        this.simulationConfig = this.config.simulation;
        
        console.log('🎱 볼 굴리기 게임 센서 관리자 초기화 완료');
    }
    
    /**
     * 센서 데이터를 게임 입력으로 변환 (오버라이드)
     */
    convertToGameInput() {
        const orientation = this.sensorData.orientation;
        const accelerometer = this.sensorData.accelerometer;
        
        // 방향 센서를 기본 기울기로 변환
        let tiltX = 0;
        let tiltY = 0;
        
        if (orientation) {
            // 센서 감도 적용
            tiltX = this.safeMultiply(orientation.gamma || 0, this.sensorConfig.orient);
            tiltY = this.safeMultiply(orientation.beta || 0, this.sensorConfig.orient);
        }
        
        // 범위 제한 및 데드존 적용
        tiltX = this.applyDeadzone(this.clamp(tiltX, -1, 1), this.sensorConfig.deadzone);
        tiltY = this.applyDeadzone(this.clamp(tiltY, -1, 1), this.sensorConfig.deadzone);
        
        // 극값 필터링
        tiltX = this.filterExtreme(tiltX, 10);
        tiltY = this.filterExtreme(tiltY, 10);
        
        // 게임 입력 업데이트
        this.gameInput.x = tiltX;
        this.gameInput.y = tiltY;
        this.gameInput.speed = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
        
        // 가속도계로 브레이크 감지 (급격한 움직임)
        if (accelerometer) {
            const magnitude = this.vectorMagnitude(accelerometer);
            if (magnitude > 15) {
                this.gameInput.brake = 1.0;
                // 일정 시간 후 브레이크 해제
                setTimeout(() => {
                    this.gameInput.brake = 0;
                }, 300);
            }
        }
        
        // 입력 유효성 검사
        if (!ValidationUtils.isValidGameInput(this.gameInput)) {
            console.warn('볼 게임 입력 데이터가 유효하지 않습니다:', this.gameInput);
            this.resetGameInput();
        }
    }
    
    /**
     * 시뮬레이션 모드 업데이트 (오버라이드)
     */
    updateSimulation() {
        if (!this.simulationMode) return;
        
        let targetX = 0;
        let targetY = 0;
        
        // 키 매핑 (설정에서 로드)
        const keyConfig = this.simulationConfig.keys;
        
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) targetX = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) targetX = 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) targetY = -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) targetY = 1;
        
        // 부드러운 전환 (설정된 스무딩 값 사용)
        const smoothing = this.simulationConfig.smoothing;
        this.gameInput.x = this.lerp(this.gameInput.x, targetX, smoothing);
        this.gameInput.y = this.lerp(this.gameInput.y, targetY, smoothing);
        
        // 감도 적용
        this.gameInput.x *= this.simulationConfig.sensitivity;
        this.gameInput.y *= this.simulationConfig.sensitivity;
        
        // 속도 계산
        this.gameInput.speed = Math.sqrt(
            this.gameInput.x * this.gameInput.x + 
            this.gameInput.y * this.gameInput.y
        );
        
        // 브레이크 (스페이스바)
        this.gameInput.brake = this.keys['Space'] ? 1 : 0;
        
        // 콜백 호출
        this.notifyCallbacks();
    }
    
    /**
     * 키 다운 이벤트 처리 (오버라이드)
     */
    onKeyDown(event) {
        super.onKeyDown(event);
        
        // 볼 게임 전용 키 처리
        switch (event.code) {
            case 'KeyR':
                // 센서 재보정
                this.recalibrateData();
                UIUtils.showToast('센서 재보정 완료', 'success', 1000);
                break;
                
            case 'Escape':
                // 시뮬레이션 모드 토글
                if (this.simulationMode) {
                    this.connectToServer();
                } else {
                    this.startSimulationMode();
                }
                break;
        }
    }
    
    /**
     * 데드존 적용
     */
    applyDeadzone(value, deadzone) {
        const absValue = Math.abs(value);
        if (absValue < deadzone) {
            return 0;
        }
        
        // 데드존 보정
        const sign = value >= 0 ? 1 : -1;
        const adjustedValue = (absValue - deadzone) / (1 - deadzone);
        return sign * Math.min(adjustedValue, 1);
    }
    
    /**
     * 센서 데이터 재보정
     */
    recalibrateData() {
        // 히스토리 초기화
        this.dataHistory = {
            orientation: [],
            accelerometer: [],
            gyroscope: []
        };
        
        // 게임 입력 초기화
        this.resetGameInput();
        
        console.log('🎱 볼 게임 센서 데이터 재보정 완료');
    }
    
    /**
     * 게임 입력 초기화
     */
    resetGameInput() {
        this.gameInput = {
            x: 0,
            y: 0,
            speed: 0,
            brake: 0
        };
    }
    
    /**
     * 게임별 상태 정보 가져오기
     */
    getGameStatus() {
        return {
            connected: this.isConnected,
            simulation: this.simulationMode,
            input: { ...this.gameInput },
            config: {
                sensitivity: this.sensorConfig,
                simulation: this.simulationConfig
            },
            performance: {
                dataRate: this.getDataRate(),
                latency: this.getLatency()
            }
        };
    }
    
    /**
     * 데이터 전송률 계산
     */
    getDataRate() {
        const now = Date.now();
        if (!this.lastDataTime) {
            this.lastDataTime = now;
            return 0;
        }
        
        const deltaTime = now - this.lastDataTime;
        this.lastDataTime = now;
        
        return deltaTime > 0 ? Math.round(1000 / deltaTime) : 0;
    }
    
    /**
     * 지연시간 계산
     */
    getLatency() {
        if (!this.sensorData.timestamp) return 0;
        return Math.abs(Date.now() - this.sensorData.timestamp);
    }
    
    /**
     * 디버그 정보 출력
     */
    debugInfo() {
        console.group('🎱 볼 게임 센서 디버그 정보');
        console.log('게임 입력:', this.gameInput);
        console.log('센서 데이터:', this.sensorData);
        console.log('설정:', this.config);
        console.log('연결 상태:', this.isConnected);
        console.log('시뮬레이션 모드:', this.simulationMode);
        console.log('데이터 전송률:', this.getDataRate() + ' Hz');
        console.log('지연시간:', this.getLatency() + ' ms');
        console.groupEnd();
    }
}

// 전역 변수로 등록 (기존 코드와의 호환성)
if (typeof window !== 'undefined') {
    window.BallGameSensorManager = BallGameSensorManager;
    
    // 기존 SensorManager 클래스명과의 호환성
    window.SensorManager = BallGameSensorManager;
}

// 모듈 내보내기 (ES6 모듈 방식)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BallGameSensorManager;
}