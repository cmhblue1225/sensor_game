/**
 * 센서 게임 플랫폼 - 유효성 검사 유틸리티 라이브러리
 * 센서 데이터, 게임 입력, 설정 값 등의 유효성을 검사하는 함수들을 제공
 */
class ValidationUtils {
    /**
     * 기본 숫자 유효성 검사
     */
    static isValidNumber(value) {
        return typeof value === 'number' && isFinite(value) && !isNaN(value);
    }
    
    /**
     * 안전한 숫자 여부 확인 (극값 제외)
     */
    static isSafeNumber(value, maxValue = 10000) {
        return this.isValidNumber(value) && Math.abs(value) <= maxValue;
    }
    
    /**
     * 2D 벡터 유효성 검사
     */
    static isValidVector2D(vector) {
        return vector && 
               typeof vector === 'object' &&
               this.isValidNumber(vector.x) &&
               this.isValidNumber(vector.y);
    }
    
    /**
     * 3D 벡터 유효성 검사
     */
    static isValidVector3D(vector) {
        return vector && 
               typeof vector === 'object' &&
               this.isValidNumber(vector.x) &&
               this.isValidNumber(vector.y) &&
               this.isValidNumber(vector.z);
    }
    
    /**
     * 방향 센서 데이터 유효성 검사
     */
    static isValidOrientation(orientation) {
        if (!orientation || typeof orientation !== 'object') {
            return false;
        }
        
        const { alpha, beta, gamma } = orientation;
        
        // 각도 범위 검사
        return this.isValidNumber(alpha) && alpha >= 0 && alpha <= 360 &&
               this.isValidNumber(beta) && beta >= -180 && beta <= 180 &&
               this.isValidNumber(gamma) && gamma >= -90 && gamma <= 90;
    }
    
    /**
     * 가속도계 데이터 유효성 검사
     */
    static isValidAccelerometer(accelerometer) {
        if (!this.isValidVector3D(accelerometer)) {
            return false;
        }
        
        const { x, y, z } = accelerometer;
        const maxAcceleration = 50; // m/s²
        
        return Math.abs(x) <= maxAcceleration &&
               Math.abs(y) <= maxAcceleration &&
               Math.abs(z) <= maxAcceleration;
    }
    
    /**
     * 자이로스코프 데이터 유효성 검사
     */
    static isValidGyroscope(gyroscope) {
        if (!this.isValidVector3D(gyroscope)) {
            return false;
        }
        
        const { x, y, z } = gyroscope;
        const maxAngularVelocity = 1000; // deg/s
        
        return Math.abs(x) <= maxAngularVelocity &&
               Math.abs(y) <= maxAngularVelocity &&
               Math.abs(z) <= maxAngularVelocity;
    }
    
    /**
     * 전체 센서 데이터 유효성 검사
     */
    static isValidSensorData(sensorData) {
        if (!sensorData || typeof sensorData !== 'object') {
            return false;
        }
        
        let hasValidData = false;
        
        // 최소 하나의 유효한 센서 데이터가 있어야 함
        if (sensorData.orientation && this.isValidOrientation(sensorData.orientation)) {
            hasValidData = true;
        }
        
        if (sensorData.accelerometer && this.isValidAccelerometer(sensorData.accelerometer)) {
            hasValidData = true;
        }
        
        if (sensorData.gyroscope && this.isValidGyroscope(sensorData.gyroscope)) {
            hasValidData = true;
        }
        
        // 타임스탬프 검사
        if (sensorData.timestamp) {
            const now = Date.now();
            const timeDiff = Math.abs(now - sensorData.timestamp);
            if (timeDiff > 5000) { // 5초 이상 차이나면 무효
                return false;
            }
        }
        
        return hasValidData;
    }
    
    /**
     * 게임 입력 유효성 검사
     */
    static isValidGameInput(gameInput) {
        if (!gameInput || typeof gameInput !== 'object') {
            return false;
        }
        
        // 공통 입력 필드 검사
        const commonFields = ['x', 'y', 'z', 'brake', 'handbrake', 'thrust', 'power'];
        
        for (const field of commonFields) {
            if (gameInput.hasOwnProperty(field)) {
                const value = gameInput[field];
                if (!this.isValidNumber(value)) {
                    return false;
                }
                
                // 일반적인 입력 값 범위 검사 (-1 ~ 1 또는 0 ~ 1)
                if (Math.abs(value) > 10) { // 너무 극단적인 값
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * 기울기 입력 유효성 검사
     */
    static isValidTiltInput(tiltInput) {
        if (!tiltInput || typeof tiltInput !== 'object') {
            return false;
        }
        
        const { x, y } = tiltInput;
        
        return this.isValidNumber(x) && Math.abs(x) <= 1 &&
               this.isValidNumber(y) && Math.abs(y) <= 1;
    }
    
    /**
     * 색상 값 유효성 검사 (RGB)
     */
    static isValidColor(color) {
        if (typeof color === 'string') {
            // 헥스 색상 검사
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;
            return hexPattern.test(color);
        }
        
        if (typeof color === 'object' && color !== null) {
            // RGB 객체 검사
            const { r, g, b } = color;
            return this.isValidNumber(r) && r >= 0 && r <= 255 &&
                   this.isValidNumber(g) && g >= 0 && g <= 255 &&
                   this.isValidNumber(b) && b >= 0 && b <= 255;
        }
        
        return false;
    }
    
    /**
     * 게임 설정 유효성 검사
     */
    static isValidGameConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }
        
        // 필수 필드 검사
        const requiredFields = ['gameType', 'sensitivity'];
        for (const field of requiredFields) {
            if (!config.hasOwnProperty(field)) {
                return false;
            }
        }
        
        // 게임 타입 검사
        const validGameTypes = [
            'ball-rolling', 'spaceship', 'racing', 'shooter', 
            'runner', 'hurdle', 'ramen', 'staggering', 'baseball', 'rhythm'
        ];
        
        if (!validGameTypes.includes(config.gameType)) {
            return false;
        }
        
        // 감도 설정 검사
        if (typeof config.sensitivity !== 'object') {
            return false;
        }
        
        const { gyro, accel, orient } = config.sensitivity;
        if (!this.isValidNumber(gyro) || !this.isValidNumber(accel) || !this.isValidNumber(orient)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * WebSocket 메시지 유효성 검사
     */
    static isValidWebSocketMessage(message) {
        if (!message || typeof message !== 'object') {
            return false;
        }
        
        // 필수 필드 검사
        if (!message.type || typeof message.type !== 'string') {
            return false;
        }
        
        // 메시지 타입별 검사
        switch (message.type) {
            case 'sensor_data':
                return this.isValidSensorData(message.data);
                
            case 'game_client_register':
                return message.deviceId && 
                       message.gameType && 
                       Array.isArray(message.capabilities);
                       
            case 'ping':
            case 'pong':
                return true;
                
            default:
                return false;
        }
    }
    
    /**
     * 화면 좌표 유효성 검사
     */
    static isValidScreenCoordinate(x, y, screenWidth, screenHeight) {
        return this.isValidNumber(x) && x >= 0 && x <= screenWidth &&
               this.isValidNumber(y) && y >= 0 && y <= screenHeight;
    }
    
    /**
     * 게임 객체 위치 유효성 검사
     */
    static isValidGameObjectPosition(position, bounds) {
        if (!this.isValidVector2D(position) || !this.isValidVector2D(bounds)) {
            return false;
        }
        
        const { x, y } = position;
        const { x: maxX, y: maxY } = bounds;
        
        return x >= 0 && x <= maxX && y >= 0 && y <= maxY;
    }
    
    /**
     * 속도 벡터 유효성 검사
     */
    static isValidVelocity(velocity, maxSpeed = 1000) {
        if (!this.isValidVector2D(velocity)) {
            return false;
        }
        
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        return speed <= maxSpeed;
    }
    
    /**
     * 충돌 박스 유효성 검사
     */
    static isValidBoundingBox(box) {
        if (!box || typeof box !== 'object') {
            return false;
        }
        
        const { x, y, width, height } = box;
        
        return this.isValidNumber(x) && this.isValidNumber(y) &&
               this.isValidNumber(width) && width > 0 &&
               this.isValidNumber(height) && height > 0;
    }
    
    /**
     * 게임 점수 유효성 검사
     */
    static isValidScore(score) {
        return this.isValidNumber(score) && score >= 0 && score <= 999999999;
    }
    
    /**
     * 게임 시간 유효성 검사
     */
    static isValidGameTime(time) {
        return this.isValidNumber(time) && time >= 0 && time <= 86400000; // 24시간
    }
    
    /**
     * 레벨 번호 유효성 검사
     */
    static isValidLevel(level, maxLevel = 100) {
        return this.isValidNumber(level) && 
               Number.isInteger(level) && 
               level >= 1 && level <= maxLevel;
    }
    
    /**
     * 오디오 볼륨 유효성 검사
     */
    static isValidVolume(volume) {
        return this.isValidNumber(volume) && volume >= 0 && volume <= 1;
    }
    
    /**
     * 디바이스 ID 유효성 검사
     */
    static isValidDeviceId(deviceId) {
        if (typeof deviceId !== 'string') {
            return false;
        }
        
        // 최소/최대 길이 검사
        if (deviceId.length < 3 || deviceId.length > 50) {
            return false;
        }
        
        // 영숫자, 하이픈, 언더스코어만 허용
        const pattern = /^[A-Za-z0-9_-]+$/;
        return pattern.test(deviceId);
    }
    
    /**
     * 데이터 스무딩 버퍼 유효성 검사
     */
    static isValidSmoothingBuffer(buffer, maxSize = 20) {
        if (!Array.isArray(buffer)) {
            return false;
        }
        
        if (buffer.length > maxSize) {
            return false;
        }
        
        // 모든 요소가 유효한 센서 데이터인지 확인
        return buffer.every(item => 
            this.isValidVector2D(item) || 
            this.isValidVector3D(item) || 
            this.isValidOrientation(item)
        );
    }
    
    /**
     * 게임 상태 유효성 검사
     */
    static isValidGameState(gameState) {
        if (!gameState || typeof gameState !== 'object') {
            return false;
        }
        
        const validStates = ['loading', 'playing', 'paused', 'gameOver', 'menu'];
        
        return gameState.hasOwnProperty('current') && 
               validStates.includes(gameState.current);
    }
    
    /**
     * 안전한 값 반환 (유효하지 않으면 기본값 반환)
     */
    static getSafeValue(value, defaultValue, validator = null) {
        if (validator && typeof validator === 'function') {
            return validator(value) ? value : defaultValue;
        }
        
        return this.isValidNumber(value) ? value : defaultValue;
    }
    
    /**
     * 안전한 벡터 반환
     */
    static getSafeVector2D(vector, defaultVector = { x: 0, y: 0 }) {
        return this.isValidVector2D(vector) ? vector : defaultVector;
    }
    
    /**
     * 안전한 벡터 반환 (3D)
     */
    static getSafeVector3D(vector, defaultVector = { x: 0, y: 0, z: 0 }) {
        return this.isValidVector3D(vector) ? vector : defaultVector;
    }
    
    /**
     * 배열 유효성 검사
     */
    static isValidArray(array, minLength = 0, maxLength = Infinity) {
        return Array.isArray(array) && 
               array.length >= minLength && 
               array.length <= maxLength;
    }
    
    /**
     * 함수 유효성 검사
     */
    static isValidFunction(func) {
        return typeof func === 'function';
    }
    
    /**
     * 이벤트 핸들러 유효성 검사
     */
    static isValidEventHandler(handler) {
        return this.isValidFunction(handler);
    }
}

// 모듈 내보내기 (ES6 모듈 방식)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationUtils;
}