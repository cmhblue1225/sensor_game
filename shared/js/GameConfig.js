/**
 * 센서 게임 플랫폼 - 게임 설정 관리 클래스
 * 모든 게임의 설정을 통합 관리하고 일관된 인터페이스를 제공
 */
class GameConfig {
    /**
     * 게임별 기본 센서 설정
     */
    static SENSOR_CONFIGS = {
        'ball-rolling': {
            gyro: 0.03,
            accel: 0.08,
            orient: 0.02,
            smoothing: 5,
            deadzone: 0.1
        },
        'spaceship': {
            gyro: 0.03,
            accel: 0.08,
            orient: 0.01,
            smoothing: 3,
            deadzone: 0.05
        },
        'racing': {
            gyro: 0.04,
            accel: 0.06,
            orient: 0.03,
            smoothing: 4,
            deadzone: 0.08
        },
        'shooter': {
            gyro: 0.05,
            accel: 0.10,
            orient: 0.04,
            smoothing: 3,
            deadzone: 0.12
        },
        'runner': {
            gyro: 0.06,
            accel: 0.12,
            orient: 0.05,
            smoothing: 4,
            deadzone: 0.15
        },
        'hurdle': {
            gyro: 0.08,
            accel: 0.15,
            orient: 0.06,
            smoothing: 2,
            deadzone: 0.20
        },
        'ramen': {
            gyro: 0.10,
            accel: 0.20,
            orient: 0.08,
            smoothing: 3,
            deadzone: 0.25
        },
        'staggering': {
            gyro: 0.12,
            accel: 0.25,
            orient: 0.10,
            smoothing: 6,
            deadzone: 0.30
        },
        'baseball': {
            gyro: 0.15,
            accel: 0.30,
            orient: 0.12,
            smoothing: 2,
            deadzone: 0.10
        },
        'rhythm': {
            gyro: 0.20,
            accel: 0.35,
            orient: 0.15,
            smoothing: 2,
            deadzone: 0.05
        }
    };
    
    /**
     * 게임별 시뮬레이션 모드 키 매핑
     */
    static SIMULATION_CONFIGS = {
        'ball-rolling': {
            keys: {
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                up: ['KeyW', 'ArrowUp'],
                down: ['KeyS', 'ArrowDown'],
                action: ['Space']
            },
            sensitivity: 0.8,
            smoothing: 0.1
        },
        'spaceship': {
            keys: {
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                up: ['KeyW', 'ArrowUp'],
                down: ['KeyS', 'ArrowDown'],
                thrustUp: ['Space'],
                thrustDown: ['ShiftLeft'],
                reset: ['KeyR']
            },
            sensitivity: 0.6,
            smoothing: 0.15
        },
        'racing': {
            keys: {
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                accelerate: ['KeyW', 'ArrowUp'],
                brake: ['KeyS', 'ArrowDown'],
                handbrake: ['Space']
            },
            sensitivity: 0.9,
            smoothing: 0.08
        },
        'shooter': {
            keys: {
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                up: ['KeyW', 'ArrowUp'],
                down: ['KeyS', 'ArrowDown'],
                shoot: ['Space', 'Enter']
            },
            sensitivity: 0.7,
            smoothing: 0.12
        },
        'runner': {
            keys: {
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                jump: ['Space', 'ArrowUp']
            },
            sensitivity: 1.0,
            smoothing: 0.05
        },
        'hurdle': {
            keys: {
                jump: ['Space', 'ArrowUp', 'KeyW']
            },
            sensitivity: 1.2,
            smoothing: 0.03
        },
        'ramen': {
            keys: {
                slurp: ['Space', 'Enter']
            },
            sensitivity: 1.0,
            smoothing: 0.1
        },
        'staggering': {
            keys: {
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                up: ['KeyW', 'ArrowUp'],
                down: ['KeyS', 'ArrowDown'],
                shake: ['Space']
            },
            sensitivity: 0.5,
            smoothing: 0.2
        },
        'baseball': {
            keys: {
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                up: ['KeyW', 'ArrowUp'],
                down: ['KeyS', 'ArrowDown'],
                swing: ['Space', 'Enter']
            },
            sensitivity: 0.8,
            smoothing: 0.1
        },
        'rhythm': {
            keys: {
                shake: ['Space', 'Enter'],
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight']
            },
            sensitivity: 1.1,
            smoothing: 0.05
        }
    };
    
    /**
     * 게임별 물리 설정
     */
    static PHYSICS_CONFIGS = {
        'ball-rolling': {
            gravity: 0.5,
            friction: 0.98,
            bounce: 0.8,
            maxSpeed: 10
        },
        'spaceship': {
            thrustPower: 40,
            maneuverPower: 25,
            rotationSpeed: 4,
            angularDrag: 0.92,
            maxSpeed: 15
        },
        'racing': {
            acceleration: 0.5,
            deceleration: 0.3,
            maxSpeed: 12,
            turnSpeed: 0.1,
            friction: 0.95
        },
        'shooter': {
            projectileSpeed: 15,
            fireRate: 0.2,
            turretSpeed: 0.08,
            recoil: 0.1
        },
        'runner': {
            runSpeed: 8,
            jumpPower: 12,
            gravity: 0.8,
            friction: 0.9
        },
        'hurdle': {
            runSpeed: 10,
            jumpPower: 15,
            gravity: 0.9,
            hurdleHeight: 1.5
        },
        'ramen': {
            slurpPower: 0.3,
            temperatureDecay: 0.5,
            comboDecay: 0.1
        },
        'staggering': {
            walkSpeed: 3,
            staggerAmount: 2,
            recoveryRate: 0.1,
            drunkIncrement: 10
        },
        'baseball': {
            pitchSpeed: 12,
            batSpeed: 8,
            ballBounce: 0.7,
            gravity: 0.6
        },
        'rhythm': {
            shakeThreshold: 8,
            comboMultiplier: 1.2,
            perfectTiming: 100,
            goodTiming: 200
        }
    };
    
    /**
     * 게임별 UI 설정
     */
    static UI_CONFIGS = {
        'ball-rolling': {
            showTilt: true,
            showSpeed: true,
            showLevel: true,
            showLives: true,
            sensorDisplay: 'detailed'
        },
        'spaceship': {
            showTilt: true,
            showSpeed: true,
            showFuel: true,
            showLives: true,
            sensorDisplay: 'detailed'
        },
        'racing': {
            showTilt: true,
            showSpeed: true,
            showLap: true,
            showPosition: true,
            sensorDisplay: 'simple'
        },
        'shooter': {
            showTilt: true,
            showScore: true,
            showAmmo: true,
            showWave: true,
            sensorDisplay: 'simple'
        },
        'runner': {
            showTilt: false,
            showDistance: true,
            showScore: true,
            showLives: true,
            sensorDisplay: 'minimal'
        },
        'hurdle': {
            showTilt: false,
            showTime: true,
            showPosition: true,
            showRecord: true,
            sensorDisplay: 'minimal'
        },
        'ramen': {
            showTilt: false,
            showTemperature: true,
            showCombo: true,
            showScore: true,
            sensorDisplay: 'custom'
        },
        'staggering': {
            showTilt: true,
            showDrunk: true,
            showStage: true,
            showDistance: true,
            sensorDisplay: 'detailed'
        },
        'baseball': {
            showTilt: true,
            showPitch: true,
            showSwing: true,
            showScore: true,
            sensorDisplay: 'detailed'
        },
        'rhythm': {
            showTilt: false,
            showBeat: true,
            showCombo: true,
            showScore: true,
            sensorDisplay: 'rhythm'
        }
    };
    
    /**
     * WebSocket 연결 설정
     */
    static WEBSOCKET_CONFIG = {
        reconnectAttempts: 5,
        reconnectDelay: 2000,
        heartbeatInterval: 30000,
        timeout: 5000
    };
    
    /**
     * 게임별 센서 설정 가져오기
     */
    static getSensorConfig(gameType) {
        const config = this.SENSOR_CONFIGS[gameType];
        if (!config) {
            console.warn(`게임 타입 '${gameType}'에 대한 센서 설정을 찾을 수 없습니다. 기본값을 사용합니다.`);
            return this.SENSOR_CONFIGS['ball-rolling'];
        }
        return { ...config };
    }
    
    /**
     * 게임별 시뮬레이션 설정 가져오기
     */
    static getSimulationConfig(gameType) {
        const config = this.SIMULATION_CONFIGS[gameType];
        if (!config) {
            console.warn(`게임 타입 '${gameType}'에 대한 시뮬레이션 설정을 찾을 수 없습니다. 기본값을 사용합니다.`);
            return this.SIMULATION_CONFIGS['ball-rolling'];
        }
        return { ...config };
    }
    
    /**
     * 게임별 물리 설정 가져오기
     */
    static getPhysicsConfig(gameType) {
        const config = this.PHYSICS_CONFIGS[gameType];
        if (!config) {
            console.warn(`게임 타입 '${gameType}'에 대한 물리 설정을 찾을 수 없습니다. 기본값을 사용합니다.`);
            return this.PHYSICS_CONFIGS['ball-rolling'];
        }
        return { ...config };
    }
    
    /**
     * 게임별 UI 설정 가져오기
     */
    static getUIConfig(gameType) {
        const config = this.UI_CONFIGS[gameType];
        if (!config) {
            console.warn(`게임 타입 '${gameType}'에 대한 UI 설정을 찾을 수 없습니다. 기본값을 사용합니다.`);
            return this.UI_CONFIGS['ball-rolling'];
        }
        return { ...config };
    }
    
    /**
     * 전체 게임 설정 가져오기
     */
    static getGameConfig(gameType) {
        return {
            gameType: gameType,
            sensor: this.getSensorConfig(gameType),
            simulation: this.getSimulationConfig(gameType),
            physics: this.getPhysicsConfig(gameType),
            ui: this.getUIConfig(gameType),
            websocket: { ...this.WEBSOCKET_CONFIG }
        };
    }
    
    /**
     * 사용자 정의 설정 적용
     */
    static applyCustomConfig(gameType, customConfig) {
        const baseConfig = this.getGameConfig(gameType);
        
        // 깊은 병합 수행
        return this.deepMerge(baseConfig, customConfig);
    }
    
    /**
     * 설정 값 유효성 검사
     */
    static validateConfig(config) {
        const errors = [];
        
        // 필수 필드 검사
        if (!config.gameType) {
            errors.push('gameType이 필요합니다.');
        }
        
        // 센서 설정 검사
        if (config.sensor) {
            const { gyro, accel, orient, smoothing, deadzone } = config.sensor;
            
            if (typeof gyro !== 'number' || gyro <= 0) {
                errors.push('sensor.gyro는 양수여야 합니다.');
            }
            
            if (typeof accel !== 'number' || accel <= 0) {
                errors.push('sensor.accel는 양수여야 합니다.');
            }
            
            if (typeof orient !== 'number' || orient <= 0) {
                errors.push('sensor.orient는 양수여야 합니다.');
            }
            
            if (typeof smoothing !== 'number' || smoothing < 1) {
                errors.push('sensor.smoothing은 1 이상이어야 합니다.');
            }
            
            if (typeof deadzone !== 'number' || deadzone < 0 || deadzone > 1) {
                errors.push('sensor.deadzone은 0과 1 사이여야 합니다.');
            }
        }
        
        // 시뮬레이션 설정 검사
        if (config.simulation) {
            const { sensitivity, smoothing } = config.simulation;
            
            if (typeof sensitivity !== 'number' || sensitivity <= 0) {
                errors.push('simulation.sensitivity는 양수여야 합니다.');
            }
            
            if (typeof smoothing !== 'number' || smoothing < 0 || smoothing > 1) {
                errors.push('simulation.smoothing은 0과 1 사이여야 합니다.');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * 로컬 스토리지에 설정 저장
     */
    static saveConfig(gameType, config) {
        try {
            const key = `sensorGame_${gameType}_config`;
            localStorage.setItem(key, JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('설정 저장 실패:', error);
            return false;
        }
    }
    
    /**
     * 로컬 스토리지에서 설정 불러오기
     */
    static loadConfig(gameType) {
        try {
            const key = `sensorGame_${gameType}_config`;
            const configString = localStorage.getItem(key);
            
            if (configString) {
                const customConfig = JSON.parse(configString);
                return this.applyCustomConfig(gameType, customConfig);
            }
        } catch (error) {
            console.error('설정 로드 실패:', error);
        }
        
        return this.getGameConfig(gameType);
    }
    
    /**
     * 설정 초기화
     */
    static resetConfig(gameType) {
        try {
            const key = `sensorGame_${gameType}_config`;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('설정 초기화 실패:', error);
            return false;
        }
    }
    
    /**
     * 지원되는 게임 타입 목록
     */
    static getSupportedGameTypes() {
        return Object.keys(this.SENSOR_CONFIGS);
    }
    
    /**
     * 게임 타입 유효성 검사
     */
    static isValidGameType(gameType) {
        return this.getSupportedGameTypes().includes(gameType);
    }
    
    /**
     * 깊은 병합 유틸리티
     */
    static deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    /**
     * 설정 디버그 정보 출력
     */
    static debugConfig(gameType) {
        console.group(`🎮 게임 설정 디버그 - ${gameType}`);
        
        const config = this.getGameConfig(gameType);
        console.log('전체 설정:', config);
        
        console.log('센서 설정:', config.sensor);
        console.log('시뮬레이션 설정:', config.simulation);
        console.log('물리 설정:', config.physics);
        console.log('UI 설정:', config.ui);
        
        const validation = this.validateConfig(config);
        console.log('유효성 검사:', validation);
        
        console.groupEnd();
    }
}

// 모듈 내보내기 (ES6 모듈 방식)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}