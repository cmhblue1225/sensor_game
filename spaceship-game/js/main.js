/**
 * 메인 게임 스크립트
 * 모든 게임 컴포넌트를 초기화하고 게임 루프를 관리
 */
class SpaceshipGame {
    constructor() {
        this.gameEngine = null;
        this.sensorManager = null;
        this.spaceship = null;
        this.asteroidManager = null;
        this.gameLogic = null;
        
        this.isRunning = false;
        this.lastTime = 0;
        this.loadingProgress = 0;
        this.isInitialized = false;
        
        // UI 요소들
        this.loadingScreen = document.getElementById('loadingScreen');
        this.mainMenu = document.getElementById('mainMenu');
        this.gameContainer = document.getElementById('gameContainer');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.instructionsScreen = document.getElementById('instructionsScreen');
        
        this.init();
    }
    
    /**
     * 게임 초기화
     */
    async init() {
        try {
            console.log('게임 초기화 시작...');
            
            // 로딩 진행률 업데이트
            this.updateLoadingProgress(10, '게임 엔진 초기화...');
            
            // 게임 엔진 초기화
            this.gameEngine = new GameEngine(this.gameContainer);
            await this.delay(500);
            
            this.updateLoadingProgress(30, '센서 관리자 초기화...');
            
            // 센서 관리자 초기화
            this.sensorManager = new SensorManager();
            await this.delay(500);
            
            this.updateLoadingProgress(50, '우주선 생성...');
            
            // 우주선 생성
            this.spaceship = new Spaceship(this.gameEngine.scene);
            await this.delay(300);
            
            this.updateLoadingProgress(70, '소행성 시스템 초기화...');
            
            // 소행성 관리자 초기화
            this.asteroidManager = new AsteroidManager(this.gameEngine.scene);
            await this.delay(300);
            
            this.updateLoadingProgress(85, '게임 로직 초기화...');
            
            // 게임 로직 초기화
            this.gameLogic = new GameLogic();
            await this.delay(300);
            
            this.updateLoadingProgress(95, '이벤트 리스너 설정...');
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            this.setupGameCallbacks();
            await this.delay(200);
            
            this.updateLoadingProgress(100, '게임 준비 완료!');
            
            // 초기화 완료
            await this.delay(500);
            this.isInitialized = true;
            this.showMainMenu();
            
            console.log('게임 초기화 완료!');
            
        } catch (error) {
            console.error('게임 초기화 실패:', error);
            this.showError('게임 초기화에 실패했습니다.');
        }
    }
    
    /**
     * 로딩 진행률 업데이트
     */
    updateLoadingProgress(progress, message) {
        this.loadingProgress = progress;
        
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        const loadingText = this.loadingScreen.querySelector('p');
        if (loadingText && message) {
            loadingText.textContent = message;
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 메뉴 버튼들
        document.getElementById('startGameBtn')?.addEventListener('click', () => this.startGame());
        document.getElementById('instructionsBtn')?.addEventListener('click', () => this.showInstructions());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettings());
        
        // 조작법 화면
        document.getElementById('backToMenuBtn')?.addEventListener('click', () => this.showMainMenu());
        
        // 게임 내 컨트롤
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('exitBtn')?.addEventListener('click', () => this.exitToMenu());
        
        // 일시정지 메뉴
        document.getElementById('resumeBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn')?.addEventListener('click', () => this.restartGame());
        document.getElementById('mainMenuBtn')?.addEventListener('click', () => this.exitToMenu());
        
        // 게임 오버 화면
        document.getElementById('playAgainBtn')?.addEventListener('click', () => this.restartGame());
        document.getElementById('backToMainBtn')?.addEventListener('click', () => this.showMainMenu());
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 센서 데이터 콜백
        this.sensorManager.onSensorData((gameInput, sensorData) => {
            this.updateSensorDisplay(sensorData);
        });
    }
    
    /**
     * 게임 로직 콜백 설정
     */
    setupGameCallbacks() {
        this.gameLogic.on('onGameOver', (data) => {
            this.showGameOver(data);
        });
        
        this.gameLogic.on('onScoreChange', (score) => {
            this.updateScore(score);
        });
        
        this.gameLogic.on('onLivesChange', (lives) => {
            this.updateLives(lives);
        });
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        if (!this.isInitialized) {
            console.error('게임이 아직 초기화되지 않았습니다!');
            return;
        }
        
        console.log('🎮 게임 시작');
        
        // 화면 전환
        this.hideAllScreens();
        this.gameContainer.style.display = 'block';
        console.log('🎮 게임 컨테이너 표시됨');
        console.log('게임 컨테이너 스타일:', this.gameContainer.style.cssText);
        
        // 렌더링 강제 실행 (컨테이너가 표시된 후)
        setTimeout(() => {
            console.log('🎨 컨테이너 표시 후 렌더링 시도');
            this.gameEngine.render();
        }, 50);
        
        // 게임 상태 초기화
        this.spaceship.reset();
        this.asteroidManager.clearAll();
        this.gameLogic.startGame();
        console.log('게임 상태 초기화 완료');
        
        // 센서 보정
        if (this.sensorManager.isConnectedToSensor()) {
            this.sensorManager.calibrate();
            console.log('센서 보정 완료');
        } else {
            console.log('센서 연결 없음 - 시뮬레이션 모드');
        }
        
        // 즉시 여러 번 렌더링 시도 (확실한 렌더링 보장)
        this.render();
        setTimeout(() => this.render(), 100);
        setTimeout(() => this.render(), 500);
        console.log('초기 렌더링 완료 (3회 시도)');
        
        // 게임 루프 시작
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('게임 루프 시작됨');
    }
    
    /**
     * 게임 루프
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 게임이 실행 중일 때만 업데이트
        if (this.gameLogic.getGameState() === 'playing') {
            this.update(deltaTime);
        }
        
        // 렌더링은 항상 수행
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * 게임 업데이트
     */
    update(deltaTime) {
        // deltaTime 유효성 검사 (NaN 방지)
        if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
            return; // 비정상적인 deltaTime은 무시
        }
        
        // 센서 입력 가져오기
        const gameInput = this.sensorManager.getGameInput();
        
        // 우주선 업데이트
        this.spaceship.update(deltaTime, gameInput);
        
        // 소행성 시스템 업데이트
        this.asteroidManager.update(deltaTime, this.spaceship.getPosition());
        
        // 충돌 체크
        const collisions = this.asteroidManager.checkCollisions(this.spaceship);
        collisions.forEach(collision => {
            this.gameLogic.handleCollision(collision, this.spaceship);
        });
        
        // 게임 로직 업데이트
        this.gameLogic.update(deltaTime, this.spaceship);
        
        // 게임 엔진 업데이트
        this.gameEngine.update(deltaTime);
        
        // 카메라 업데이트
        this.gameEngine.updateCamera(
            this.spaceship.getPosition(),
            this.spaceship.getRotation()
        );
        
        // UI 업데이트
        this.updateGameUI();
    }
    
    /**
     * 렌더링
     */
    render() {
        try {
            this.gameEngine.render();
        } catch (error) {
            console.error('렌더링 오류:', error);
        }
    }
    
    /**
     * 게임 UI 업데이트
     */
    updateGameUI() {
        // 연료 게이지
        const fuelFill = document.getElementById('fuelFill');
        if (fuelFill) {
            const fuelRatio = this.spaceship.getFuelRatio();
            fuelFill.style.width = `${fuelRatio * 100}%`;
            
            // 연료 부족 경고
            if (fuelRatio < 0.2) {
                fuelFill.style.backgroundColor = '#ff4444';
            } else if (fuelRatio < 0.5) {
                fuelFill.style.backgroundColor = '#ffaa00';
            } else {
                fuelFill.style.backgroundColor = '#00ff00';
            }
        }
    }
    
    /**
     * 센서 디스플레이 업데이트
     */
    updateSensorDisplay(sensorData) {
        // 자이로스코프 값
        document.getElementById('gyroX').textContent = sensorData.gyroscope.x.toFixed(1);
        document.getElementById('gyroY').textContent = sensorData.gyroscope.y.toFixed(1);
        document.getElementById('gyroZ').textContent = sensorData.gyroscope.z.toFixed(1);
        
        // 가속도계 값
        document.getElementById('accelX').textContent = sensorData.accelerometer.x.toFixed(1);
        document.getElementById('accelY').textContent = sensorData.accelerometer.y.toFixed(1);
        document.getElementById('accelZ').textContent = sensorData.accelerometer.z.toFixed(1);
    }
    
    /**
     * 일시정지 토글
     */
    togglePause() {
        if (this.gameLogic.getGameState() === 'playing') {
            this.gameLogic.pauseGame();
            this.pauseMenu.style.display = 'flex';
        } else if (this.gameLogic.getGameState() === 'paused') {
            this.gameLogic.pauseGame();
            this.pauseMenu.style.display = 'none';
        }
    }
    
    /**
     * 게임 재시작
     */
    restartGame() {
        this.hideAllScreens();
        this.startGame();
    }
    
    /**
     * 메뉴로 나가기
     */
    exitToMenu() {
        this.isRunning = false;
        this.hideAllScreens();
        this.showMainMenu();
    }
    
    /**
     * 조작법 표시
     */
    showInstructions() {
        this.hideAllScreens();
        this.instructionsScreen.style.display = 'flex';
    }
    
    /**
     * 설정 표시
     */
    showSettings() {
        alert('설정 기능은 추후 구현 예정입니다.');
    }
    
    /**
     * 메인 메뉴 표시
     */
    showMainMenu() {
        this.hideAllScreens();
        this.mainMenu.style.display = 'flex';
    }
    
    /**
     * 게임 오버 화면 표시
     */
    showGameOver(data) {
        this.hideAllScreens();
        this.gameOverScreen.style.display = 'flex';
        
        // 점수 표시
        document.getElementById('finalScore').textContent = data.score.toLocaleString();
        document.getElementById('highScore').textContent = data.highScore.toLocaleString();
    }
    
    /**
     * 모든 화면 숨기기
     */
    hideAllScreens() {
        this.loadingScreen.style.display = 'none';
        this.mainMenu.style.display = 'none';
        this.gameContainer.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.instructionsScreen.style.display = 'none';
    }
    
    /**
     * 점수 업데이트
     */
    updateScore(score) {
        const scoreElement = document.getElementById('scoreValue');
        if (scoreElement) {
            scoreElement.textContent = score.toLocaleString();
        }
    }
    
    /**
     * 생명 업데이트
     */
    updateLives(lives) {
        const livesElement = document.getElementById('livesValue');
        if (livesElement) {
            livesElement.textContent = lives;
        }
    }
    
    /**
     * 키보드 입력 처리
     */
    handleKeyPress(event) {
        switch (event.code) {
            case 'Escape':
                if (this.gameLogic.getGameState() === 'playing' || 
                    this.gameLogic.getGameState() === 'paused') {
                    this.togglePause();
                }
                break;
                
            case 'Space':
                if (this.gameLogic.getGameState() === 'gameOver') {
                    event.preventDefault();
                    this.restartGame();
                }
                break;
                
            case 'KeyR':
                if (this.gameLogic.getGameState() === 'playing') {
                    // 센서 재보정
                    this.sensorManager.calibrate();
                    console.log('센서 재보정됨');
                }
                break;
        }
    }
    
    /**
     * 오류 표시
     */
    showError(message) {
        const loadingText = this.loadingScreen.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#ff4444';
        }
    }
    
    /**
     * 지연 함수
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 게임 정리
     */
    dispose() {
        this.isRunning = false;
        
        if (this.gameEngine) this.gameEngine.dispose();
        if (this.spaceship) this.spaceship.dispose();
        if (this.asteroidManager) this.asteroidManager.dispose();
    }
}

// 메인 허브로 이동 함수
function goToHub() {
    window.location.href = '/';
}

// 게임 인스턴스 생성 및 시작
let game;

// DOM 로드 완료 후 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 게임 초기화 시작');
    game = new SpaceshipGame();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (game) {
        game.dispose();
    }
});