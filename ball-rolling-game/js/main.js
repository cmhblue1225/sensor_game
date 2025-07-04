/**
 * 볼 굴리기 게임 메인 클래스
 * 모든 게임 컴포넌트를 통합 관리
 */
class BallRollingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        // 캔버스 크기 확인
        if (!this.canvas || this.canvas.width <= 0 || this.canvas.height <= 0) {
            console.error('캔버스가 올바르게 초기화되지 않았습니다');
            return;
        }
        
        console.log('캔버스 크기:', this.canvas.width, 'x', this.canvas.height);
        
        this.gameEngine = new GameEngine(this.canvas);
        this.sensorManager = new SensorManager();
        this.ballPhysics = new BallPhysics(this.canvas.width, this.canvas.height);
        this.levelManager = new LevelManager(this.canvas.width, this.canvas.height);
        
        // 게임 상태
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            score: 0,
            lives: 3,
            levelComplete: false,
            gameOver: false
        };
        
        // 타이밍
        this.lastTime = 0;
        this.animationFrame = null;
        
        // 효과음을 위한 오디오 컨텍스트 (향후 추가용)
        this.audioContext = null;
        
        this.init();
    }
    
    /**
     * 게임 초기화
     */
    async init() {
        console.log('🎱 볼 굴리기 게임 초기화 시작');
        
        try {
            // 센서 매니저 콜백 설정
            this.sensorManager.onSensorData((tiltInput, sensorData) => {
                // 게임이 진행 중일 때만 센서 입력 처리
                if (this.gameState.isPlaying && !this.gameState.isPaused) {
                    // 센서 입력은 ballPhysics.update에서 처리됨
                }
            });
            
            // 물리 엔진 콜백 설정
            this.ballPhysics.onGoalCallback = (goal) => {
                this.onGoalReached(goal);
            };
            
            this.ballPhysics.onGameOver = (reason) => {
                this.onGameOver(reason);
            };
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 첫 번째 레벨 로드
            this.loadCurrentLevel();
            
            // 게임 시작
            this.startGame();
            
            console.log('✅ 게임 초기화 완료');
            
        } catch (error) {
            console.error('❌ 게임 초기화 실패:', error);
        } finally {
            // 로딩 화면 숨기기
            document.getElementById('loadingScreen').style.display = 'none';
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 창 크기 변경
        window.addEventListener('resize', () => this.handleResize());
        
        // 키보드 입력
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 게임 일시정지/재개 (스페이스바)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState.isPlaying) {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        // 센서 보정 (R키)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyR') {
                this.sensorManager.calibrate();
                console.log('센서 보정됨');
            }
        });
        
        // 터치 이벤트 (모바일)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.initializeAudioContext(); // 사용자 제스처로 AudioContext 초기화
            this.togglePause();
        }, { passive: false });
        
        // 클릭 이벤트 (데스크톱)
        this.canvas.addEventListener('click', () => {
            this.initializeAudioContext(); // 사용자 제스처로 AudioContext 초기화
        });
    }
    
    /**
     * 현재 레벨 로드
     */
    loadCurrentLevel() {
        const levelData = this.levelManager.getCurrentLevel();
        this.ballPhysics.setLevel(levelData);
        
        console.log(`레벨 ${this.levelManager.getCurrentLevelNumber()} 로드됨: ${levelData.name}`);
        
        // UI 업데이트
        this.updateUI();
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        this.gameState.isPlaying = true;
        this.gameState.isPaused = false;
        this.gameState.gameOver = false;
        this.gameState.levelComplete = false;
        
        this.startGameLoop();
        console.log('🎮 게임 시작됨');
    }
    
    /**
     * 게임 루프 시작
     */
    startGameLoop() {
        this.lastTime = performance.now();
        this.animationFrame = requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * 메인 게임 루프
     */
    gameLoop = (currentTime) => {
        if (!this.gameState.isPlaying) return;
        
        // 첫 번째 프레임에서는 deltaTime을 0으로 설정
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30); // 최대 30fps로 제한
        this.lastTime = currentTime;
        
        // deltaTime 유효성 검사
        if (!isFinite(deltaTime) || deltaTime <= 0) {
            console.warn('유효하지 않은 deltaTime:', deltaTime, 'currentTime:', currentTime);
            this.animationFrame = requestAnimationFrame(this.gameLoop);
            return;
        }
        
        // 게임이 일시정지되지 않았을 때만 업데이트
        if (!this.gameState.isPaused && !this.gameState.gameOver && !this.gameState.levelComplete) {
            this.update(deltaTime);
        }
        
        this.render();
        
        this.animationFrame = requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * 게임 상태 업데이트
     */
    update(deltaTime) {
        // 센서 입력 가져오기
        const tiltInput = this.sensorManager.getTiltInput();
        
        // 물리 엔진 업데이트
        this.ballPhysics.update(deltaTime, tiltInput);
        
        // 레벨 완료 체크
        if (this.ballPhysics.allGoalsReached() && !this.gameState.levelComplete) {
            this.onLevelComplete();
        }
    }
    
    /**
     * 렌더링
     */
    render() {
        const renderData = {
            ball: this.ballPhysics.getBall(),
            particles: this.ballPhysics.getParticles(),
            obstacles: this.ballPhysics.obstacles,
            goals: this.ballPhysics.goals,
            holes: this.ballPhysics.holes,
            levelComplete: this.gameState.levelComplete
        };
        
        this.gameEngine.render(renderData);
    }
    
    /**
     * 목표 달성 처리
     */
    onGoalReached(goal) {
        // 점수 추가
        this.gameState.score += 100;
        this.updateUI();
        
        console.log('🎯 목표 달성! 점수:', this.gameState.score);
        
        // 간단한 효과음 (Web Audio API)
        this.playSound('goal');
    }
    
    /**
     * 레벨 완료 처리
     */
    onLevelComplete() {
        this.gameState.levelComplete = true;
        this.gameState.score += 500; // 레벨 완료 보너스
        
        console.log('🏆 레벨 완료!');
        this.playSound('levelComplete');
        
        // 2초 후 다음 레벨로 이동
        setTimeout(() => {
            this.nextLevel();
        }, 2000);
    }
    
    /**
     * 다음 레벨로 이동
     */
    nextLevel() {
        if (this.levelManager.nextLevel()) {
            // 다음 레벨 로드
            this.loadCurrentLevel();
            this.gameState.levelComplete = false;
            console.log(`다음 레벨: ${this.levelManager.getCurrentLevelNumber()}`);
        } else {
            // 모든 레벨 완료
            this.onGameComplete();
        }
    }
    
    /**
     * 게임 완료 처리
     */
    onGameComplete() {
        this.gameState.isPlaying = false;
        console.log('🎉 게임 완료! 최종 점수:', this.gameState.score);
        
        alert(`🎉 축하합니다! 모든 레벨을 완료했습니다!\n최종 점수: ${this.gameState.score}`);
        this.showGameOver();
    }
    
    /**
     * 게임 오버 처리
     */
    onGameOver(reason) {
        this.gameState.lives--;
        this.updateUI();
        
        if (this.gameState.lives <= 0) {
            this.gameState.gameOver = true;
            this.gameState.isPlaying = false;
            
            console.log('💀 게임 오버');
            this.playSound('gameOver');
            
            setTimeout(() => {
                this.showGameOver();
            }, 1000);
        } else {
            // 생명이 남아있으면 현재 레벨 재시작
            console.log(`💔 생명 하나 잃음. 남은 생명: ${this.gameState.lives}`);
            this.playSound('lifeLost');
            
            setTimeout(() => {
                this.loadCurrentLevel();
            }, 1000);
        }
    }
    
    /**
     * 게임 오버 화면 표시
     */
    showGameOver() {
        document.getElementById('finalScore').textContent = this.gameState.score;
        document.getElementById('finalLevel').textContent = this.levelManager.getCurrentLevelNumber();
        document.getElementById('gameOverScreen').style.display = 'block';
    }
    
    /**
     * 게임 재시작
     */
    restartGame() {
        this.gameState.score = 0;
        this.gameState.lives = 3;
        this.gameState.isPlaying = false;
        this.gameState.gameOver = false;
        this.gameState.levelComplete = false;
        
        this.levelManager.resetLevel();
        this.loadCurrentLevel();
        
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.startGame();
        console.log('🔄 게임 재시작됨');
    }
    
    /**
     * 일시정지 토글
     */
    togglePause() {
        if (!this.gameState.isPlaying || this.gameState.gameOver) return;
        
        this.gameState.isPaused = !this.gameState.isPaused;
        console.log(this.gameState.isPaused ? '⏸️ 일시정지' : '▶️ 재개');
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        document.getElementById('scoreValue').textContent = this.gameState.score;
        document.getElementById('levelValue').textContent = this.levelManager.getCurrentLevelNumber();
        document.getElementById('livesValue').textContent = this.gameState.lives;
    }
    
    /**
     * 키보드 입력 처리
     */
    handleKeyPress(event) {
        switch (event.code) {
            case 'Escape':
                if (this.gameState.isPlaying) {
                    this.togglePause();
                }
                break;
        }
    }
    
    /**
     * 창 크기 변경 처리
     */
    handleResize() {
        const container = document.getElementById('gameContainer');
        const rect = container.getBoundingClientRect();
        
        // 캔버스 크기 조정 (비율 유지)
        const maxWidth = Math.min(window.innerWidth - 40, 800);
        const maxHeight = Math.min(window.innerHeight - 40, 600);
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = maxHeight + 'px';
    }
    
    /**
     * AudioContext 초기화 (사용자 제스처 후)
     */
    initializeAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('AudioContext 초기화됨');
            } catch (error) {
                console.log('AudioContext 초기화 실패:', error);
            }
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('AudioContext resumed');
            }).catch(error => {
                console.log('AudioContext resume 실패:', error);
            });
        }
    }
    
    /**
     * 효과음 재생 (Web Audio API 사용)
     */
    playSound(type) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // AudioContext가 suspended 상태이면 resume
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.createSound(type);
                }).catch(error => {
                    console.log('AudioContext resume 실패:', error);
                });
                return;
            }
            
            this.createSound(type);
        } catch (error) {
            console.log('효과음 재생 실패:', error);
        }
    }
    
    /**
     * 실제 사운드 생성
     */
    createSound(type) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 사운드 타입별 주파수 설정
            switch (type) {
                case 'goal':
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                    break;
                    
                case 'levelComplete':
                    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(900, this.audioContext.currentTime + 0.2);
                    oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.4);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.6);
                    break;
                    
                case 'lifeLost':
                    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                    break;
                    
                case 'gameOver':
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime + 0.5);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 1.0);
                    break;
            }
        } catch (error) {
            console.log('사운드 생성 실패:', error);
        }
    }
}

// 전역 함수들 (HTML에서 호출)
function restartGame() {
    if (window.game) {
        window.game.restartGame();
    }
}

function showMenu() {
    // 향후 메인 메뉴 화면 구현
    if (window.game) {
        window.game.restartGame();
    }
}

function goToMain() {
    // 메인 페이지로 이동
    window.location.href = '/';
}

// DOM 로드 완료 후 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 볼 굴리기 게임 초기화 시작');
    window.game = new BallRollingGame();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (window.game && window.game.animationFrame) {
        cancelAnimationFrame(window.game.animationFrame);
    }
});