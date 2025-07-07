/**
 * 3D 센서 야구 게임 메인 컨트롤러
 * 모든 시스템을 통합하고 게임 로직을 관리
 */

class BaseballGame {
    constructor() {
        // 게임 시스템들
        this.engine = null;
        this.sensorManager = null;
        this.batController = null;
        this.ballPhysics = null;
        this.pitchingSystem = null;
        this.collisionDetector = null;
        this.scoringSystem = null;
        
        // 게임 상태
        this.gameState = 'waiting'; // waiting, playing, paused, finished
        this.isInitialized = false;
        
        // 설정
        this.simulationMode = false;
        
        this.init();
    }
    
    /**
     * 게임 초기화
     */
    async init() {
        try {
            console.log('3D 센서 야구 게임 초기화 중...');
            
            // 시스템 순서대로 초기화
            await this.initializeSystems();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // UI 초기화
            this.initializeUI();
            
            this.isInitialized = true;
            this.gameState = 'waiting';
            
            console.log('게임 초기화 완료!');
            
        } catch (error) {
            console.error('게임 초기화 실패:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * 시스템들 초기화
     */
    async initializeSystems() {
        // 1. 3D 엔진 초기화
        this.engine = new BaseballEngine('canvasContainer');
        
        // 2. 센서 매니저 초기화
        this.sensorManager = new SensorManager();
        
        // 3. 배트 컨트롤러 초기화
        this.batController = new BatController(this.engine, this.sensorManager);
        
        // 4. 공 물리학 시스템 초기화
        this.ballPhysics = new BallPhysics(this.engine);
        
        // 5. 투구 시스템 초기화
        this.pitchingSystem = new PitchingSystem(this.ballPhysics);
        
        // 6. 충돌 감지 시스템 초기화
        this.collisionDetector = new CollisionDetector(this.batController, this.ballPhysics);
        
        // 7. 점수 시스템 초기화
        this.scoringSystem = new ScoringSystem();
        
        // 시뮬레이션 모드 체크
        setTimeout(() => {
            if (!this.sensorManager.isConnectedToSensor()) {
                this.enableSimulationMode();
            }
        }, 3000);
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 게임 컨트롤 버튼들
        this.setupGameControls();
        
        // 센서 관련 이벤트
        this.setupSensorEvents();
        
        // 게임 진행 이벤트
        this.setupGameProgressEvents();
        
        // 키보드 단축키
        this.setupKeyboardShortcuts();
        
        // 창 크기 변경
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }
    
    /**
     * 게임 컨트롤 설정
     */
    setupGameControls() {
        // 게임 시작 버튼
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        // 리셋 버튼
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetGame();
            });
        }
        
        // 센서 보정 버튼
        const calibrateButton = document.getElementById('calibrateButton');
        if (calibrateButton) {
            calibrateButton.addEventListener('click', () => {
                this.calibrateSensor();
            });
        }
        
        // 다시 플레이 버튼 (모달 내)
        const playAgainButton = document.getElementById('playAgainButton');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.playAgain();
            });
        }
    }
    
    /**
     * 센서 이벤트 설정
     */
    setupSensorEvents() {
        // 시뮬레이션 모드 활성화
        document.addEventListener('simulationModeEnabled', () => {
            this.enableSimulationMode();
        });
        
        // 센서 데이터 업데이트 (디버그용)
        document.addEventListener('sensorUpdate', (event) => {
            // 필요시 센서 데이터 로깅
            if (this.debugMode) {
                console.log('센서 데이터:', event.detail);
            }
        });
    }
    
    /**
     * 게임 진행 이벤트 설정
     */
    setupGameProgressEvents() {
        // 투구 이벤트
        document.addEventListener('pitchThrown', (event) => {
            this.handlePitchThrown(event.detail);
        });
        
        // 타격 이벤트
        document.addEventListener('baseballHit', (event) => {
            this.handleBaseballHit(event.detail);
        });
        
        // 게임 종료 이벤트
        document.addEventListener('gameEnd', () => {
            this.handleGameEnd();
        });
    }
    
    /**
     * 키보드 단축키 설정
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    if (this.simulationMode) {
                        event.preventDefault();
                        // 스페이스바는 BatController에서 처리
                    }
                    break;
                    
                case 'KeyS':
                    if (this.gameState === 'waiting') {
                        this.startGame();
                    }
                    break;
                    
                case 'KeyR':
                    this.resetGame();
                    break;
                    
                case 'KeyC':
                    this.calibrateSensor();
                    break;
            }
        });
    }
    
    /**
     * UI 초기화
     */
    initializeUI() {
        this.updateGameStatus('게임 시작 준비 완료');
        this.updateButtonStates();
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        if (this.gameState !== 'waiting') {
            console.log('게임을 시작할 수 없는 상태입니다');
            return;
        }
        
        console.log('게임 시작!');
        
        this.gameState = 'playing';
        this.updateGameStatus('게임 진행 중...');
        this.updateButtonStates();
        
        // 게임 시작 이벤트 발생
        const gameStartEvent = new CustomEvent('gameStart');
        document.dispatchEvent(gameStartEvent);
        
        // 첫 번째 투구 준비 메시지
        this.updatePitchStatus('첫 번째 투구를 준비하세요!');
    }
    
    /**
     * 게임 리셋
     */
    resetGame() {
        console.log('게임 리셋');
        
        this.gameState = 'waiting';
        
        // 게임 리셋 이벤트 발생
        const gameResetEvent = new CustomEvent('gameReset');
        document.dispatchEvent(gameResetEvent);
        
        // UI 리셋
        this.updateGameStatus('게임 시작 준비 완료');
        this.updateButtonStates();
        
        // 모든 공 제거
        this.ballPhysics.clearAllBalls();
        
        // 배트 리셋
        this.batController.resetBat();
    }
    
    /**
     * 센서 보정
     */
    calibrateSensor() {
        if (this.sensorManager) {
            this.sensorManager.calibrate();
            this.updateGameStatus('센서 보정 완료');
        }
    }
    
    /**
     * 다시 플레이
     */
    playAgain() {
        this.resetGame();
        setTimeout(() => {
            this.startGame();
        }, 500);
    }
    
    /**
     * 시뮬레이션 모드 활성화
     */
    enableSimulationMode() {
        this.simulationMode = true;
        this.batController.setSimulationMode(true);
        
        console.log('시뮬레이션 모드 활성화');
        this.updateGameStatus('시뮬레이션 모드 (센서 없이 플레이)');
    }
    
    /**
     * 투구 이벤트 처리
     */
    handlePitchThrown(pitchDetail) {
        const { pitchNumber, scenario } = pitchDetail;
        
        console.log(`투구 ${pitchNumber}: ${scenario.type}`);
        this.updatePitchStatus(`투구 ${pitchNumber}/10 진행 중...`);
        
        // 충돌 감지 활성화
        this.collisionDetector.setMonitoring(true);
    }
    
    /**
     * 타격 이벤트 처리
     */
    handleBaseballHit(hitDetail) {
        const { hitData, timing } = hitDetail;
        
        console.log('타격 성공!', { contact: hitData.contact, timing: timing.earlyLate });
        
        // 충돌 감지 잠시 비활성화
        this.collisionDetector.setMonitoring(false);
        
        // 시각 효과
        this.createHitCelebration();
    }
    
    /**
     * 게임 종료 처리
     */
    handleGameEnd() {
        console.log('게임 종료');
        
        this.gameState = 'finished';
        this.updateGameStatus('게임 완료!');
        this.updateButtonStates();
        
        // 충돌 감지 비활성화
        this.collisionDetector.setMonitoring(false);
        
        // 최종 통계 로그
        const stats = this.scoringSystem.getStats();
        console.log('최종 통계:', stats);
    }
    
    /**
     * 타격 축하 효과
     */
    createHitCelebration() {
        // 간단한 화면 흔들림 효과
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.classList.add('shake');
            setTimeout(() => {
                gameContainer.classList.remove('shake');
            }, 500);
        }
        
        // 관중석 환호 시뮬레이션 (색상 변화)
        if (this.engine && this.engine.crowd) {
            this.engine.crowd.forEach(person => {
                const originalColor = person.material.color.getHex();
                person.material.color.setHex(0xff6b6b);
                
                setTimeout(() => {
                    person.material.color.setHex(originalColor);
                }, 1000);
            });
        }
    }
    
    /**
     * 게임 상태 업데이트
     */
    updateGameStatus(message) {
        const statusElement = document.getElementById('pitchInfo');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    /**
     * 투구 상태 업데이트
     */
    updatePitchStatus(message) {
        const pitchInfoElement = document.getElementById('pitchInfo');
        if (pitchInfoElement) {
            pitchInfoElement.innerHTML = message;
        }
    }
    
    /**
     * 버튼 상태 업데이트
     */
    updateButtonStates() {
        const startButton = document.getElementById('startButton');
        const resetButton = document.getElementById('resetButton');
        const calibrateButton = document.getElementById('calibrateButton');
        
        if (startButton) {
            startButton.disabled = this.gameState !== 'waiting';
            startButton.textContent = this.gameState === 'waiting' ? '게임 시작' : '게임 중...';
        }
        
        if (resetButton) {
            resetButton.disabled = false;
        }
        
        if (calibrateButton) {
            calibrateButton.disabled = !this.sensorManager || !this.sensorManager.isConnectedToSensor();
        }
    }
    
    /**
     * 창 크기 변경 처리
     */
    handleWindowResize() {
        if (this.engine) {
            // 엔진의 리사이즈는 자동으로 처리됨
        }
    }
    
    /**
     * 초기화 오류 처리
     */
    handleInitializationError(error) {
        console.error('게임 초기화 오류:', error);
        
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
        `;
        errorMessage.innerHTML = `
            <h3>게임 초기화 실패</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="
                margin-top: 10px;
                padding: 10px 20px;
                background: white;
                color: #f44336;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">새로고침</button>
        `;
        
        document.body.appendChild(errorMessage);
    }
    
    /**
     * 현재 게임 상태 반환
     */
    getGameState() {
        return {
            state: this.gameState,
            isInitialized: this.isInitialized,
            simulationMode: this.simulationMode,
            pitchCount: this.pitchingSystem ? this.pitchingSystem.getPitchCount() : 0,
            score: this.scoringSystem ? this.scoringSystem.getStats() : null
        };
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        console.log('게임 리소스 정리 중...');
        
        // 각 시스템 정리
        if (this.engine) this.engine.dispose();
        if (this.sensorManager) this.sensorManager.dispose();
        if (this.batController) this.batController.dispose();
        if (this.ballPhysics) this.ballPhysics.dispose();
        if (this.pitchingSystem) this.pitchingSystem.dispose();
        if (this.collisionDetector) this.collisionDetector.dispose();
        
        console.log('게임 리소스 정리 완료');
    }
}

// 페이지 로드 시 게임 시작
let baseballGame = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('3D 센서 야구 게임 로딩 중...');
    
    // 게임 인스턴스 생성
    baseballGame = new BaseballGame();
    
    // 전역 접근을 위해 window에 추가
    window.baseballGame = baseballGame;
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (baseballGame) {
        baseballGame.dispose();
    }
});

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.BaseballGame = BaseballGame;
}