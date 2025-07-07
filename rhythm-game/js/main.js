/**
 * 센서 리듬 게임 메인 클래스
 * 가이드라인에 따른 게임 허브 호환 구조
 */

class RhythmGame {
    constructor() {
        // 게임 시스템들
        this.sensorManager = null;
        this.audioManager = null;
        this.rhythmEngine = null;
        this.stageManager = null;
        this.effectsManager = null;
        this.stageEditor = null;
        
        // 게임 상태
        this.gameState = 'loading'; // loading, menu, playing, paused, result, editor
        this.currentStage = null;
        this.isInitialized = false;
        
        // 플레이 데이터
        this.playData = {
            score: 0,
            combo: 0,
            maxCombo: 0,
            accuracy: 100,
            judgments: { perfect: 0, good: 0, miss: 0 }
        };
        
        this.init();
    }
    
    /**
     * 게임 초기화
     */
    async init() {
        try {
            console.log('센서 리듬 게임 초기화 중...');
            
            // 시스템 초기화
            await this.initializeSystems();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // UI 초기화
            this.initializeUI();
            
            this.isInitialized = true;
            this.gameState = 'menu';
            
            // 로딩 화면 숨기기
            this.hideLoadingScreen();
            
            console.log('리듬 게임 초기화 완료!');
            
        } catch (error) {
            console.error('게임 초기화 실패:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * 시스템들 초기화
     */
    async initializeSystems() {
        // 1. 센서 매니저 초기화 (가이드라인 필수)
        this.sensorManager = new SensorManager();
        this.sensorManager.onSensorData((rhythmInput, sensorData) => {
            this.handleSensorInput(rhythmInput, sensorData);
        });
        
        // 센서 연결 실패 시 자동으로 시뮬레이션 모드 활성화
        setTimeout(() => {
            console.log('센서 연결 상태 확인:', this.sensorManager.isConnected);
            if (!this.sensorManager.isConnected) {
                console.log('센서 연결 실패, 시뮬레이션 모드 자동 활성화');
                this.sensorManager.startSimulationMode();
            } else {
                console.log('센서가 연결되어 있습니다');
            }
        }, 3000);
        
        // 2. 오디오 매니저 초기화
        this.audioManager = new AudioManager();
        
        // 3. 리듬 엔진 초기화
        this.rhythmEngine = new RhythmEngine(this.audioManager);
        
        // 4. 스테이지 매니저 초기화
        this.stageManager = new StageManager();
        
        // 5. 이펙트 매니저 초기화
        this.effectsManager = new EffectsManager();
        
        // 6. 스테이지 에디터 초기화
        this.stageEditor = new StageEditor(this.audioManager);
        
        // 시뮬레이션 모드 체크
        setTimeout(() => {
            if (!this.sensorManager.isConnectedToSensor()) {
                this.sensorManager.startSimulationMode();
            }
        }, 3000);
    }
    
    /**
     * 센서 입력 처리 (가이드라인 필수)
     */
    handleSensorInput(rhythmInput, sensorData) {
        // UI 업데이트 (하향 동작 강도 표시)
        const shakeIntensityElement = document.getElementById('shakeIntensity');
        if (shakeIntensityElement) {
            shakeIntensityElement.textContent = (rhythmInput.shakeIntensity || 0).toFixed(2);
        }
        
        if (this.gameState === 'playing' && this.rhythmEngine) {
            // 하향 동작 감지 시 리듬 입력 처리
            if (rhythmInput.shake) {
                this.rhythmEngine.processRhythmInput(rhythmInput.shakeIntensity);
            }
        } else if (this.gameState === 'menu') {
            // 메뉴에서 기울기로 네비게이션 (선택적)
            this.handleMenuNavigation(rhythmInput.tilt);
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 메뉴 버튼들
        this.setupMenuEvents();
        
        // 게임 진행 이벤트
        this.setupGameEvents();
        
        // 키보드 단축키
        this.setupKeyboardShortcuts();
        
        // 센서 이벤트
        this.setupSensorEvents();
        
        // 창 크기 변경
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }
    
    /**
     * 메뉴 이벤트 설정
     */
    setupMenuEvents() {
        // 게임 시작 버튼
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.showStageSelect();
            });
        }
        
        // 스테이지 선택 버튼
        const stageSelectButton = document.getElementById('stageSelectButton');
        if (stageSelectButton) {
            stageSelectButton.addEventListener('click', () => {
                this.showStageSelect();
            });
        }
        
        // 에디터 버튼
        const editorButton = document.getElementById('editorButton');
        if (editorButton) {
            editorButton.addEventListener('click', () => {
                this.showStageEditor();
            });
        }
        
        // 뒤로가기 버튼들
        const backButtons = document.querySelectorAll('.back-btn, #backFromStageSelect, #backFromEditor');
        backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.showMainMenu();
            });
        });
        
        // 결과 화면 버튼들
        const playAgainButton = document.getElementById('playAgainButton');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.restartCurrentStage();
            });
        }
        
        const backToMenuButton = document.getElementById('backToMenuButton');
        if (backToMenuButton) {
            backToMenuButton.addEventListener('click', () => {
                this.showMainMenu();
            });
        }
    }
    
    /**
     * 게임 이벤트 설정
     */
    setupGameEvents() {
        // 리듬 판정 이벤트
        document.addEventListener('rhythmJudgment', (event) => {
            this.handleRhythmJudgment(event.detail);
        });
        
        // 스테이지 완료 이벤트
        document.addEventListener('stageComplete', (event) => {
            this.handleStageComplete(event.detail);
        });
        
        // 게임 오버 이벤트
        document.addEventListener('gameOver', () => {
            this.handleGameOver();
        });
        
        // 게임 컨트롤 버튼들
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        const stopButton = document.getElementById('stopButton');
        if (stopButton) {
            stopButton.addEventListener('click', () => {
                this.stopGame();
            });
        }
    }
    
    /**
     * 키보드 단축키 설정
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Escape':
                    if (this.gameState === 'playing') {
                        this.togglePause();
                    } else if (this.gameState !== 'menu') {
                        this.showMainMenu();
                    }
                    break;
                    
                case 'Space':
                    if (this.sensorManager && this.sensorManager.simulationMode) {
                        event.preventDefault();
                        // 스페이스바는 SensorManager에서 처리
                    }
                    break;
                    
                case 'KeyR':
                    if (this.gameState === 'playing' || this.gameState === 'result') {
                        this.restartCurrentStage();
                    }
                    break;
                    
                case 'KeyM':
                    if (this.gameState !== 'menu') {
                        this.showMainMenu();
                    }
                    break;
            }
        });
    }
    
    /**
     * 센서 이벤트 설정
     */
    setupSensorEvents() {
        // 흔들기 이벤트
        document.addEventListener('rhythmShake', (event) => {
            this.handleShakeEvent(event.detail);
        });
    }
    
    /**
     * UI 초기화
     */
    initializeUI() {
        this.showMainMenu();
        this.updateGameUI();
    }
    
    /**
     * 로딩 화면 숨기기
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
        }
    }
    
    /**
     * 메인 메뉴 표시
     */
    showMainMenu() {
        this.gameState = 'menu';
        this.hideAllScreens();
        
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.classList.add('active');
        }
        
        // 음악 정지
        if (this.audioManager) {
            this.audioManager.stop();
        }
    }
    
    /**
     * 스테이지 선택 화면 표시
     */
    showStageSelect() {
        this.hideAllScreens();
        
        const stageSelect = document.getElementById('stageSelect');
        if (stageSelect) {
            stageSelect.classList.add('active');
        }
        
        // 스테이지 목록 렌더링
        this.renderStageList();
    }
    
    /**
     * 스테이지 에디터 표시
     */
    showStageEditor() {
        this.gameState = 'editor';
        this.hideAllScreens();
        
        const editorScreen = document.getElementById('editorScreen');
        if (editorScreen) {
            editorScreen.classList.add('active');
        }
        
        // 에디터 초기화
        if (this.stageEditor) {
            this.stageEditor.show();
        }
    }
    
    /**
     * 게임 화면 표시
     */
    showGameScreen() {
        this.gameState = 'playing';
        this.hideAllScreens();
        
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.classList.add('active');
        }
    }
    
    /**
     * 결과 화면 표시
     */
    showResultScreen() {
        this.gameState = 'result';
        this.hideAllScreens();
        
        const resultScreen = document.getElementById('resultScreen');
        if (resultScreen) {
            resultScreen.classList.add('active');
        }
        
        this.displayResults();
    }
    
    /**
     * 모든 화면 숨기기
     */
    hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    /**
     * 스테이지 목록 렌더링
     */
    renderStageList() {
        const stagesGrid = document.getElementById('stagesGrid');
        if (!stagesGrid || !this.stageManager) return;
        
        const stages = this.stageManager.getAllStages();
        stagesGrid.innerHTML = '';
        
        stages.forEach((stage, index) => {
            const stageCard = document.createElement('div');
            stageCard.className = 'stage-card';
            if (stage.locked) {
                stageCard.classList.add('locked');
            }
            
            stageCard.innerHTML = `
                <div class="stage-number">${index + 1}</div>
                <div class="stage-title">${stage.title}</div>
                <div class="stage-artist">${stage.artist}</div>
                <div class="stage-difficulty">${stage.difficulty}</div>
            `;
            
            if (!stage.locked) {
                stageCard.addEventListener('click', () => {
                    this.startStage(stage);
                });
            }
            
            stagesGrid.appendChild(stageCard);
        });
    }
    
    /**
     * 스테이지 시작
     */
    async startStage(stage) {
        try {
            this.currentStage = stage;
            this.resetPlayData();
            
            // 스테이지 로드
            await this.stageManager.loadStage(stage);
            
            // 오디오 로드 (프로시더럴 모드의 경우 duration 전달)
            if (!stage.audioFile && stage.duration) {
                this.audioManager.setupProceduralAudio(stage.duration);
            } else {
                await this.audioManager.loadAudio(stage.audioFile);
            }
            
            // 리듬 엔진에 스테이지 설정
            this.rhythmEngine.setStage(stage);
            
            // 게임 화면 표시
            this.showGameScreen();
            
            // 게임 시작
            this.startGameplay();
            
        } catch (error) {
            console.error('스테이지 시작 실패:', error);
            alert('스테이지를 불러올 수 없습니다.');
        }
    }
    
    /**
     * 게임플레이 시작
     */
    startGameplay() {
        console.log('게임플레이 시작:', this.currentStage.title);
        
        // 음악 재생
        this.audioManager.play();
        
        // 리듬 엔진 시작
        this.rhythmEngine.start();
        
        // UI 업데이트 시작
        this.startUIUpdate();
    }
    
    /**
     * 리듬 판정 처리
     */
    handleRhythmJudgment(judgment) {
        const { type, score, timing } = judgment;
        
        // 점수 업데이트
        this.playData.score += score;
        this.playData.judgments[type]++;
        
        // 콤보 업데이트
        if (type !== 'miss') {
            this.playData.combo++;
            if (this.playData.combo > this.playData.maxCombo) {
                this.playData.maxCombo = this.playData.combo;
            }
        } else {
            this.playData.combo = 0;
        }
        
        // 정확도 계산
        this.calculateAccuracy();
        
        // 판정 피드백 표시
        this.showJudgmentFeedback(type);
        
        // 이펙트 재생
        this.effectsManager.playJudgmentEffect(type, timing);
        
        // UI 업데이트
        this.updateGameUI();
    }
    
    /**
     * 정확도 계산
     */
    calculateAccuracy() {
        const total = this.playData.judgments.perfect + this.playData.judgments.good + this.playData.judgments.miss;
        if (total === 0) {
            this.playData.accuracy = 100;
            return;
        }
        
        const weighted = (this.playData.judgments.perfect * 1.0 + this.playData.judgments.good * 0.7);
        this.playData.accuracy = Math.round((weighted / total) * 100);
    }
    
    /**
     * 판정 피드백 표시
     */
    showJudgmentFeedback(type) {
        const feedback = document.getElementById('judgmentFeedback');
        if (!feedback) return;
        
        const messages = {
            perfect: 'PERFECT!',
            good: 'GOOD!',
            miss: 'MISS...'
        };
        
        feedback.textContent = messages[type] || '';
        feedback.className = `feedback-popup show ${type}`;
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 1000);
    }
    
    /**
     * 스테이지 완료 처리
     */
    handleStageComplete(result) {
        console.log('스테이지 완료:', result);
        
        // 음악 정지
        this.audioManager.stop();
        
        // 리듬 엔진 정지
        this.rhythmEngine.stop();
        
        // 결과 화면 표시
        setTimeout(() => {
            this.showResultScreen();
        }, 1000);
    }
    
    /**
     * 게임 오버 처리
     */
    handleGameOver() {
        console.log('게임 오버');
        
        // 음악 정지
        this.audioManager.stop();
        
        // 리듬 엔진 정지
        this.rhythmEngine.stop();
        
        // 결과 화면 표시
        setTimeout(() => {
            this.showResultScreen();
        }, 500);
    }
    
    /**
     * 결과 표시
     */
    displayResults() {
        // 최종 점수
        const finalScore = document.getElementById('finalScore');
        if (finalScore) {
            finalScore.textContent = this.playData.score.toLocaleString();
        }
        
        // 최대 콤보
        const maxCombo = document.getElementById('maxCombo');
        if (maxCombo) {
            maxCombo.textContent = this.playData.maxCombo;
        }
        
        // 정확도
        const finalAccuracy = document.getElementById('finalAccuracy');
        if (finalAccuracy) {
            finalAccuracy.textContent = this.playData.accuracy + '%';
        }
        
        // 판정 개수
        const perfectCount = document.getElementById('perfectCount');
        const goodCount = document.getElementById('goodCount');
        const missCount = document.getElementById('missCount');
        
        if (perfectCount) perfectCount.textContent = this.playData.judgments.perfect;
        if (goodCount) goodCount.textContent = this.playData.judgments.good;
        if (missCount) missCount.textContent = this.playData.judgments.miss;
        
        // 등급 계산
        const grade = this.calculateGrade();
        const gradeValue = document.getElementById('gradeValue');
        if (gradeValue) {
            gradeValue.textContent = grade;
            gradeValue.style.color = this.getGradeColor(grade);
        }
    }
    
    /**
     * 등급 계산
     */
    calculateGrade() {
        if (this.playData.accuracy >= 95) return 'S';
        if (this.playData.accuracy >= 90) return 'A';
        if (this.playData.accuracy >= 80) return 'B';
        if (this.playData.accuracy >= 70) return 'C';
        return 'D';
    }
    
    /**
     * 등급별 색상
     */
    getGradeColor(grade) {
        const colors = {
            'S': '#FFD700',
            'A': '#C0C0C0',
            'B': '#CD7F32',
            'C': '#4CAF50',
            'D': '#9E9E9E'
        };
        return colors[grade] || '#9E9E9E';
    }
    
    /**
     * 게임 UI 업데이트
     */
    updateGameUI() {
        // 점수 업데이트
        const currentScore = document.getElementById('currentScore');
        if (currentScore) {
            currentScore.textContent = this.playData.score.toLocaleString();
        }
        
        // 콤보 업데이트
        const currentCombo = document.getElementById('currentCombo');
        if (currentCombo) {
            currentCombo.textContent = this.playData.combo;
        }
        
        // 정확도 업데이트
        const accuracy = document.getElementById('accuracy');
        if (accuracy) {
            accuracy.textContent = this.playData.accuracy + '%';
        }
        
        // 곡 제목 업데이트
        const songTitle = document.getElementById('songTitle');
        if (songTitle && this.currentStage) {
            songTitle.textContent = this.currentStage.title;
        }
    }
    
    /**
     * UI 업데이트 시작
     */
    startUIUpdate() {
        const updateUI = () => {
            if (this.gameState === 'playing' && this.audioManager) {
                // 진행률 업데이트
                const progress = this.audioManager.getProgress();
                const progressBar = document.getElementById('progressBar');
                if (progressBar) {
                    progressBar.style.setProperty('--progress', progress + '%');
                }
                
                // 시간 표시 업데이트
                const timeDisplay = document.getElementById('timeDisplay');
                if (timeDisplay) {
                    const current = this.audioManager.getCurrentTime();
                    const total = this.audioManager.getDuration();
                    timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(total)}`;
                }
            }
            
            if (this.gameState === 'playing') {
                requestAnimationFrame(updateUI);
            }
        };
        
        updateUI();
    }
    
    /**
     * 시간 포맷팅
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 플레이 데이터 리셋
     */
    resetPlayData() {
        this.playData = {
            score: 0,
            combo: 0,
            maxCombo: 0,
            accuracy: 100,
            judgments: { perfect: 0, good: 0, miss: 0 }
        };
    }
    
    /**
     * 현재 스테이지 재시작 (가이드라인 필수)
     */
    restartCurrentStage() {
        if (this.currentStage) {
            this.startStage(this.currentStage);
        }
    }
    
    /**
     * 게임 일시정지 토글
     */
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.audioManager.pause();
            this.rhythmEngine.pause();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.audioManager.resume();
            this.rhythmEngine.resume();
        }
    }
    
    /**
     * 게임 정지
     */
    stopGame() {
        this.audioManager.stop();
        this.rhythmEngine.stop();
        this.showResultScreen();
    }
    
    /**
     * 메뉴 네비게이션 처리
     */
    handleMenuNavigation(tilt) {
        // 선택적 구현: 기울기로 메뉴 항목 선택
    }
    
    /**
     * 흔들기 이벤트 처리
     */
    handleShakeEvent(detail) {
        if (this.gameState === 'playing' && this.rhythmEngine) {
            console.log('흔들기 감지, 강도:', detail.intensity);
            this.rhythmEngine.processRhythmInput(detail.intensity);
        }
    }
    
    /**
     * 창 크기 변경 처리
     */
    handleWindowResize() {
        // 필요시 캔버스 리사이즈
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
     * 리소스 정리
     */
    dispose() {
        console.log('게임 리소스 정리 중...');
        
        if (this.sensorManager) this.sensorManager.dispose();
        if (this.audioManager) this.audioManager.dispose();
        if (this.rhythmEngine) this.rhythmEngine.dispose();
        if (this.effectsManager) this.effectsManager.dispose();
        
        console.log('게임 리소스 정리 완료');
    }
}

// 전역 함수들 (가이드라인 필수)
function restartGame() {
    if (window.rhythmGame) {
        window.rhythmGame.restartCurrentStage();
    }
}

function goToMain() {
    window.location.href = '/';
}

// 페이지 로드 시 게임 시작
let rhythmGame = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('센서 리듬 게임 로딩 중...');
    
    rhythmGame = new RhythmGame();
    window.rhythmGame = rhythmGame;
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (rhythmGame) {
        rhythmGame.dispose();
    }
});

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.RhythmGame = RhythmGame;
}