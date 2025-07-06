/**
 * 게임 로직 클래스
 * 점수, 게임 상태, 충돌 처리 등을 관리
 */
class GameLogic {
    constructor() {
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = this.loadHighScore();
        
        // 게임 타이머
        this.gameTime = 0;
        this.levelTime = 0;
        this.levelDuration = 60; // 60초마다 레벨업
        
        // 점수 시스템
        this.scoringRules = {
            asteroidDestroyed: 10,
            fuelCollected: 20,
            healthCollected: 30,
            bonusCollected: 50,
            survivalBonus: 1, // 초당
            levelBonus: 100
        };
        
        // 콤보 시스템
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 3.0; // 3초
        
        // 통계
        this.stats = {
            asteroidsDestroyed: 0,
            itemsCollected: 0,
            totalDistance: 0,
            bestCombo: 0,
            playTime: 0
        };
        
        this.callbacks = {
            onScoreChange: [],
            onLivesChange: [],
            onLevelChange: [],
            onComboChange: [],
            onGameOver: [],
            onGameStart: []
        };
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameTime = 0;
        this.levelTime = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        
        // 통계 초기화
        this.stats = {
            asteroidsDestroyed: 0,
            itemsCollected: 0,
            totalDistance: 0,
            bestCombo: 0,
            playTime: 0
        };
        
        this.triggerCallbacks('onGameStart');
        this.updateUI();
        
        console.log('게임 시작!');
    }
    
    /**
     * 게임 일시정지
     */
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    /**
     * 게임 오버
     */
    gameOver() {
        this.gameState = 'gameOver';
        
        // 최고 점수 업데이트
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        // 통계 업데이트
        this.stats.playTime = this.gameTime;
        this.stats.bestCombo = this.maxCombo;
        
        this.triggerCallbacks('onGameOver', {
            score: this.score,
            highScore: this.highScore,
            stats: this.stats
        });
        
        console.log('게임 오버! 점수:', this.score);
    }
    
    /**
     * 게임 루프 업데이트
     */
    update(deltaTime, spaceship) {
        if (this.gameState !== 'playing') return;
        
        this.gameTime += deltaTime;
        this.levelTime += deltaTime;
        this.stats.playTime = this.gameTime;
        
        // 생존 보너스
        this.addScore(this.scoringRules.survivalBonus * deltaTime);
        
        // 이동 거리 계산
        if (spaceship && spaceship.velocity) {
            this.stats.totalDistance += spaceship.velocity.length() * deltaTime;
        }
        
        // 레벨업 체크
        if (this.levelTime >= this.levelDuration) {
            this.levelUp();
        }
        
        // 콤보 타이머 업데이트
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        
        this.updateUI();
    }
    
    /**
     * 충돌 처리
     */
    handleCollision(collision, spaceship) {
        const { asteroid, type } = collision;
        
        switch (type) {
            case 'obstacle':
                this.handleObstacleCollision(spaceship);
                this.stats.asteroidsDestroyed++;
                break;
                
            case 'fuel':
                this.handleFuelCollection(spaceship);
                this.stats.itemsCollected++;
                break;
                
            case 'health':
                this.handleHealthCollection(spaceship);
                this.stats.itemsCollected++;
                break;
                
            case 'bonus':
                this.handleBonusCollection(spaceship);
                this.stats.itemsCollected++;
                break;
        }
        
        // 소행성 파괴
        asteroid.destroy();
    }
    
    /**
     * 장애물 충돌 처리
     */
    handleObstacleCollision(spaceship) {
        const damage = 25;
        const destroyed = spaceship.takeDamage(damage);
        
        if (destroyed) {
            this.loseLife();
        }
        
        // 콤보 리셋
        this.resetCombo();
        
        // 화면 효과
        this.createScreenShake();
        
        console.log('장애물 충돌! 데미지:', damage);
    }
    
    /**
     * 연료 수집 처리
     */
    handleFuelCollection(spaceship) {
        const fuelAmount = 30;
        spaceship.refuel(fuelAmount);
        
        this.addScore(this.scoringRules.fuelCollected);
        this.addCombo();
        
        console.log('연료 수집! +', fuelAmount);
    }
    
    /**
     * 체력 수집 처리
     */
    handleHealthCollection(spaceship) {
        const healthAmount = 40;
        spaceship.heal(healthAmount);
        
        this.addScore(this.scoringRules.healthCollected);
        this.addCombo();
        
        console.log('체력 수집! +', healthAmount);
    }
    
    /**
     * 보너스 수집 처리
     */
    handleBonusCollection(spaceship) {
        const basePoints = this.scoringRules.bonusCollected;
        const bonusPoints = basePoints * (1 + this.combo * 0.1);
        
        this.addScore(bonusPoints);
        this.addCombo();
        
        console.log('보너스 수집! +', bonusPoints);
    }
    
    /**
     * 점수 추가
     */
    addScore(points) {
        this.score += Math.floor(points);
        this.triggerCallbacks('onScoreChange', this.score);
    }
    
    /**
     * 콤보 추가
     */
    addCombo() {
        this.combo++;
        this.comboTimer = this.comboTimeout;
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        this.triggerCallbacks('onComboChange', this.combo);
    }
    
    /**
     * 콤보 리셋
     */
    resetCombo() {
        if (this.combo > 0) {
            this.combo = 0;
            this.comboTimer = 0;
            this.triggerCallbacks('onComboChange', this.combo);
        }
    }
    
    /**
     * 생명 잃기
     */
    loseLife() {
        this.lives--;
        this.triggerCallbacks('onLivesChange', this.lives);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * 레벨업
     */
    levelUp() {
        this.level++;
        this.levelTime = 0;
        
        // 레벨 보너스
        this.addScore(this.scoringRules.levelBonus * this.level);
        
        this.triggerCallbacks('onLevelChange', this.level);
        
        console.log('레벨업!', this.level);
    }
    
    /**
     * 화면 흔들기 효과
     */
    createScreenShake() {
        // 간단한 화면 흔들기 (CSS 애니메이션으로 구현)
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.animation = 'shake 0.5s';
            setTimeout(() => {
                gameContainer.style.animation = '';
            }, 500);
        }
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        // 점수 업데이트
        const scoreElement = document.getElementById('scoreValue');
        if (scoreElement) {
            scoreElement.textContent = this.score.toLocaleString();
        }
        
        // 생명 업데이트
        const livesElement = document.getElementById('livesValue');
        if (livesElement) {
            livesElement.textContent = this.lives;
        }
        
        // 레벨 표시 (있다면)
        const levelElement = document.getElementById('levelValue');
        if (levelElement) {
            levelElement.textContent = this.level;
        }
        
        // 콤보 표시 (있다면)
        const comboElement = document.getElementById('comboValue');
        if (comboElement && this.combo > 1) {
            comboElement.textContent = `콤보 x${this.combo}`;
            comboElement.style.display = 'block';
        } else if (comboElement) {
            comboElement.style.display = 'none';
        }
    }
    
    /**
     * 센서 UI 업데이트 (디버깅용)
     */
    updateSensorUI(gameInput, sensorData) {
        // 자이로스코프 데이터 (안전한 표시)
        const gyroX = document.getElementById('gyroX');
        const gyroY = document.getElementById('gyroY');
        const gyroZ = document.getElementById('gyroZ');
        
        if (gyroX && sensorData && sensorData.gyroscope) {
            gyroX.textContent = this.safeDisplayValue(sensorData.gyroscope.x);
            gyroY.textContent = this.safeDisplayValue(sensorData.gyroscope.y);
            gyroZ.textContent = this.safeDisplayValue(sensorData.gyroscope.z);
        }
        
        // 가속도계 데이터 (안전한 표시)
        const accelX = document.getElementById('accelX');
        const accelY = document.getElementById('accelY');
        const accelZ = document.getElementById('accelZ');
        
        if (accelX && sensorData && sensorData.accelerometer) {
            accelX.textContent = this.safeDisplayValue(sensorData.accelerometer.x);
            accelY.textContent = this.safeDisplayValue(sensorData.accelerometer.y);
            accelZ.textContent = this.safeDisplayValue(sensorData.accelerometer.z);
        }
        
        // 게임 입력 데이터 (디버깅용 - 강화된 표시)
        const gameInputRoll = document.getElementById('gameInputRoll');
        const gameInputPitch = document.getElementById('gameInputPitch');
        const gameInputThrust = document.getElementById('gameInputThrust');
        
        if (gameInputRoll && gameInput) {
            gameInputRoll.textContent = this.safeDisplayValue(gameInput.roll);
            gameInputPitch.textContent = this.safeDisplayValue(gameInput.pitch);
            gameInputThrust.textContent = this.safeDisplayValue(gameInput.thrust);
            
            // 색상으로 값의 상태 표시
            this.updateInputIndicator(gameInputRoll, gameInput.roll);
            this.updateInputIndicator(gameInputPitch, gameInput.pitch);
            this.updateInputIndicator(gameInputThrust, gameInput.thrust);
        }
    }
    
    /**
     * 안전한 값 표시 (NaN 방지)
     */
    safeDisplayValue(value) {
        if (value === undefined || value === null) {
            return 'NULL';
        }
        if (!isFinite(value) || isNaN(value)) {
            return 'NaN';
        }
        return value.toFixed(2);
    }
    
    /**
     * 입력 인디케이터 색상 업데이트
     */
    updateInputIndicator(element, value) {
        if (!element) return;
        
        if (value === undefined || value === null || !isFinite(value) || isNaN(value)) {
            element.style.color = '#ff0000'; // 빨간색 - 오류
            element.style.fontWeight = 'bold';
        } else if (Math.abs(value) > 0.1) {
            element.style.color = '#00ff00'; // 초록색 - 활성
            element.style.fontWeight = 'bold';
        } else {
            element.style.color = '#ffffff'; // 흰색 - 기본
            element.style.fontWeight = 'normal';
        }
    }
    
    /**
     * 최고 점수 로드
     */
    loadHighScore() {
        const saved = localStorage.getItem('spaceship_game_high_score');
        return saved ? parseInt(saved, 10) : 0;
    }
    
    /**
     * 최고 점수 저장
     */
    saveHighScore() {
        localStorage.setItem('spaceship_game_high_score', this.highScore.toString());
    }
    
    /**
     * 콜백 등록
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    /**
     * 콜백 호출
     */
    triggerCallbacks(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }
    
    /**
     * 게임 상태 반환
     */
    getGameState() {
        return this.gameState;
    }
    
    /**
     * 현재 점수 반환
     */
    getScore() {
        return this.score;
    }
    
    /**
     * 최고 점수 반환
     */
    getHighScore() {
        return this.highScore;
    }
    
    /**
     * 현재 레벨 반환
     */
    getLevel() {
        return this.level;
    }
    
    /**
     * 게임 통계 반환
     */
    getStats() {
        return { ...this.stats };
    }
}

// CSS 애니메이션 추가 (동적으로)
if (!document.querySelector('#gameShakeStyle')) {
    const style = document.createElement('style');
    style.id = 'gameShakeStyle';
    style.textContent = `
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
}