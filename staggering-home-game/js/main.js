const STAGES = [
    {
        name: "골목길",
        obstacleCount: 10,
        drunkennessRate: 0.05,
        duration: 30000, // 30초
        backgroundColor: '#2c3e50'
    },
    {
        name: "번화가",
        obstacleCount: 20,
        drunkennessRate: 0.1,
        duration: 40000, // 40초
        backgroundColor: '#34495e'
    },
    {
        name: "주택가",
        obstacleCount: 15,
        drunkennessRate: 0.07,
        duration: 35000, // 35초
        backgroundColor: '#4a6980'
    },
    {
        name: "공원",
        obstacleCount: 12,
        drunkennessRate: 0.06,
        duration: 30000, // 30초
        backgroundColor: '#556b2f'
    },
    {
        name: "마지막 고비",
        obstacleCount: 25,
        drunkennessRate: 0.15,
        duration: 50000, // 50초
        backgroundColor: '#1a2a3a'
    }
];

class StaggeringHomeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasDimensions();

        this.sensorManager = new SensorManager();
        this.messageEl = document.getElementById('message');

        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            radius: 20,
            angle: 0,
            velocity: { x: 0, y: 0 },
            stagger: 0, // 비틀거림 정도
            drunkenness: 0, // 취함 수치 (0-100)
            maxDrunkenness: 100,
            score: 0
        };

        this.home = {
            x: this.canvas.width / 2,
            y: 50,
            radius: 30
        };

        this.obstacles = this.generateObstacles();

        this.currentStageIndex = 0; // Add this line
        this.startTime = Date.now();
        this.gameover = false;

        this.currentStageIndex = 0;
        this.currentStageIndex = 0;
        this.stageStartTime = Date.now();
        this.gameover = false;

        this.sensorManager.onSensorData(this.handleSensorInput.bind(this));
        
        document.getElementById('loadingScreen').style.display = 'none';
        this.startStage(this.currentStageIndex);
        this.gameLoop();
    }

    setCanvasDimensions() {
        this.canvas.width = Math.min(window.innerWidth, 800);
        this.canvas.height = Math.min(window.innerHeight, 600);
    }

    startStage(stageIndex) {
        if (stageIndex >= STAGES.length) {
            this.endGame(true, "모든 스테이지를 클리어했습니다! 대단해요!");
            return;
        }

        this.currentStageIndex = stageIndex;
        const stage = STAGES[this.currentStageIndex];

        this.obstacles = this.generateObstacles(stage.obstacleCount);
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;
        this.player.drunkenness = Math.max(0, this.player.drunkenness - 20); // 스테이지 시작 시 취함 약간 감소
        this.stageStartTime = Date.now();

        this.showMessage(`스테이지 ${this.currentStageIndex + 1}: ${stage.name} 시작!`, 2000);
    }

    generateObstacles(count) {
        const obstacles = [];
        const obstacleTypes = ['trashcan', 'lamppost', 'puddle'];
        for (let i = 0; i < count; i++) {
            obstacles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height - 200) + 100,
                radius: Math.random() * 15 + 10,
                type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)]
            });
        }
        return obstacles;
    }

    handleSensorInput(tiltInput, sensorData) {
        if (this.gameover) return;

        const moveSpeed = 2;
        this.player.velocity.x = tiltInput.x * moveSpeed;
        this.player.velocity.y = -tiltInput.y * moveSpeed; // Y축 반전

        if (tiltInput.action) {
            this.player.drunkenness = Math.max(0, this.player.drunkenness - 10);
            this.showMessage("크으~ 정신이 번쩍!", 1000);
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update() {
        if (this.gameover) return;

        const stage = STAGES[this.currentStageIndex];

        // 시간 경과에 따른 점수 증가 및 취함 수치 증가
        this.player.score += 0.1;
        this.player.drunkenness += stage.drunkennessRate; // 스테이지별 취함 증가율 적용

        // 플레이어 위치 업데이트
        this.player.x += this.player.velocity.x;
        this.player.y += this.player.velocity.y;

        // 비틀거림 효과 (취함 수치에 비례)
        this.player.stagger = this.player.drunkenness * 0.2; // 취함 수치에 따라 비틀거림 강도 조절
        this.player.x += Math.sin(Date.now() / 100) * this.player.stagger * 0.2;

        // 경계 체크
        this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));

        // 장애물 충돌 체크
        this.obstacles.forEach(obs => {
            const dist = Math.hypot(this.player.x - obs.x, this.player.y - obs.y);
            if (dist < this.player.radius + obs.radius) {
                this.player.drunkenness = Math.min(this.player.maxDrunkenness, this.player.drunkenness + 10);
                this.player.score = Math.max(0, this.player.score - 5);
                this.showMessage("아야! (취함: " + Math.floor(this.player.drunkenness) + ")", 1000);

                obs.x = Math.random() * this.canvas.width;
                obs.y = Math.random() * (this.canvas.height - 200) + 100;
            }
        });

        // 취함 수치에 따른 게임 오버
        if (this.player.drunkenness >= this.player.maxDrunkenness) {
            this.endGame(false, "너무 취해서 쓰러졌어요...");
        }

        // 집 도착 체크
        const distToHome = Math.hypot(this.player.x - this.home.x, this.player.y - this.home.y);
        if (distToHome < this.player.radius + this.home.radius) {
            this.startStage(this.currentStageIndex + 1);
        }

        // 스테이지 완료 조건 (시간 기반) - 집 도착으로 대체되므로 제거
        // if (Date.now() - this.stageStartTime > stage.duration) {
        //     this.startStage(this.currentStageIndex + 1);
        // }

        // UI 업데이트
        document.getElementById('message').innerText = `스테이지: ${this.currentStageIndex + 1}/${STAGES.length} | 점수: ${Math.floor(this.player.score)} | 취함: ${Math.floor(this.player.drunkenness)}`;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const stage = STAGES[this.currentStageIndex];
        // 배경 (밤거리 - 스테이지별 색상)
        this.ctx.fillStyle = stage.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 가로등 (간단한 사각형)
        this.ctx.fillStyle = '#f1c40f'; // 노란색 불빛
        for (let i = 0; i < this.canvas.width; i += 100) {
            this.ctx.fillRect(i + 20, 0, 5, 50);
        }

        // 집 (최종 목적지이므로 항상 동일)
        this.ctx.fillStyle = 'gold';
        this.ctx.beginPath();
        this.ctx.arc(this.home.x, this.home.y, this.home.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🏠', this.home.x, this.home.y);

        // 장애물
        this.obstacles.forEach(obs => {
            this.ctx.beginPath();
            this.ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
            
            if (obs.type === 'trashcan') {
                this.ctx.fillStyle = '#7f8c8d'; // 회색 쓰레기통
            } else if (obs.type === 'lamppost') {
                this.ctx.fillStyle = '#34495e'; // 어두운 가로등 기둥
            } else if (obs.type === 'puddle') {
                this.ctx.fillStyle = '#3498db'; // 파란색 물웅덩이
            }
            this.ctx.fill();

            // 장애물 아이콘 (선택 사항)
            this.ctx.font = '15px Arial';
            this.ctx.fillStyle = 'white';
            if (obs.type === 'trashcan') {
                this.ctx.fillText('🗑️', obs.x, obs.y);
            } else if (obs.type === 'lamppost') {
                this.ctx.fillText('💡', obs.x, obs.y);
            } else if (obs.type === 'puddle') {
                this.ctx.fillText('💧', obs.x, obs.y);
            }
        });

        // 플레이어
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        const angle = Math.atan2(this.player.velocity.y, this.player.velocity.x) + Math.PI / 2;
        this.ctx.rotate(angle + (Math.sin(Date.now() / 100) * this.player.stagger * 0.02));
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 눈 (취함 수치에 따라 색깔 변경)
        const eyeColor = this.player.drunkenness > 50 ? 'purple' : 'red';
        this.ctx.fillStyle = eyeColor;
        this.ctx.beginPath();
        this.ctx.arc(-8, -5, 3, 0, Math.PI * 2);
        this.ctx.arc(8, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    showMessage(text, duration) {
        const tempMessageEl = document.createElement('div');
        tempMessageEl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 2em;
            z-index: 1000;
            opacity: 1;
            transition: opacity 0.5s ease-out;
        `;
        tempMessageEl.innerText = text;
        document.body.appendChild(tempMessageEl);

        setTimeout(() => {
            tempMessageEl.style.opacity = '0';
            tempMessageEl.addEventListener('transitionend', () => tempMessageEl.remove());
        }, duration);
    }

    endGame(success, messageText) {
        if (this.gameover) return;
        this.gameover = true;
        const endTime = Date.now();
        
        // Ensure startTime is a valid number
        if (typeof this.startTime !== 'number' || Number.isNaN(this.startTime)) {
            this.startTime = endTime; // Fallback to current time if startTime is invalid
        }
        
        // Calculate raw time difference
        let rawTimeDiff = (endTime - this.startTime) / 1000;

        // Check if rawTimeDiff is NaN, and if so, default to 0
        const timeTaken = Number.isNaN(rawTimeDiff) ? '0.00' : rawTimeDiff.toFixed(2);

        const screen = document.getElementById('gameOverScreen');
        const message = document.getElementById('gameOverMessage');
        document.getElementById('timeTaken').innerText = timeTaken;

        message.innerText = messageText;
        screen.style.display = 'flex';

        const finalScoreEl = document.createElement('p');
        finalScoreEl.innerText = `최종 점수: ${Math.floor(this.player.score)}`;
        screen.appendChild(finalScoreEl);

        const finalDrunkennessEl = document.createElement('p');
        finalDrunkennessEl.innerText = `최종 취함: ${Math.floor(this.player.drunkenness)}`;
        screen.appendChild(finalDrunkennessEl);
    }
}
