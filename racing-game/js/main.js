/**
 * 센서 레이싱 게임 메인 클래스
 */
class RacingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('캔버스를 찾을 수 없습니다!');
            return;
        }

        this.gameEngine = new GameEngine(this.canvas);
        this.sensorManager = new SensorManager();
        
        const worldSize = { width: 3000, height: 2000 };
        this.carPhysics = new CarPhysics(worldSize.width, worldSize.height);

        this.gameState = {
            isPlaying: false,
            isPaused: false,
            gameOver: false,
            startTime: 0,
            elapsedTime: 0,
            lap: 1,
            totalLaps: 3,
            lastCheckpoint: -1
        };

        this.track = this.createTrack(worldSize.width, worldSize.height);
        this.carPhysics.setTrack(this.track);

        this.init();
    }

    init() {
        console.log('🏎️ 레이싱 게임 초기화');
        this.gameEngine.setCameraTarget(this.carPhysics.playerCar);
        this.setupEventListeners();
        this.startGame();
        document.getElementById('loadingScreen').style.display = 'none';
    }

    createTrack(width, height) {
        const path = [];
        const trackWidth = 150;
        const center = { x: width / 2, y: height / 2 };
        const radiusX = width * 0.4;
        const radiusY = height * 0.35;

        for (let i = 0; i <= 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            const x = center.x + Math.cos(angle) * radiusX * (1 + 0.2 * Math.sin(angle * 2));
            const y = center.y + Math.sin(angle) * radiusY * (1 + 0.2 * Math.cos(angle * 3));
            path.push({ x, y });
        }

        const finishLine = {
            x: path[0].x,
            y: path[0].y,
            angle: Math.atan2(path[1].y - path[0].y, path[1].x - path[0].x) + Math.PI / 2
        };

        return {
            path,
            width: trackWidth,
            finishLine,
            isPointOnTrack: (x, y) => {
                const closest = this.getClosestPointOnTrack(x, y, path);
                return Math.hypot(x - closest.x, y - closest.y) < trackWidth / 2;
            },
            getClosestPoint: (x, y) => this.getClosestPointOnTrack(x, y, path)
        };
    }

    getClosestPointOnTrack(x, y, path) {
        let closestPoint = null;
        let minDistance = Infinity;
        for (const point of path) {
            const distance = Math.hypot(x - point.x, y - point.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }
        return closestPoint;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyR') this.sensorManager.calibrate();
        });
    }

    startGame() {
        this.gameState.isPlaying = true;
        this.gameState.startTime = performance.now();
        this.gameLoop();
    }

    gameLoop = (currentTime) => {
        if (!this.gameState.isPlaying) return;

        const deltaTime = Math.min((currentTime - (this.lastTime || currentTime)) / 1000, 1 / 30);
        this.lastTime = currentTime;

        if (!this.gameState.isPaused && !this.gameState.gameOver) {
            this.update(deltaTime, currentTime);
        }

        this.render();
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime, currentTime) {
        const tiltInput = this.sensorManager.getTiltInput();
        this.carPhysics.update(deltaTime, tiltInput);
        this.checkLapCompletion();
        this.gameState.elapsedTime = (currentTime - this.gameState.startTime) / 1000;
        this.updateUI();
    }

    checkLapCompletion() {
        const player = this.carPhysics.playerCar;
        const finishLine = this.track.finishLine;
        const distanceToFinish = Math.hypot(player.x - finishLine.x, player.y - finishLine.y);

        // 결승선 통과 로직 (간단한 버전)
        if (distanceToFinish < this.track.width / 2) {
            // 한 바퀴를 거의 다 돌았는지 체크 (예: 마지막 체크포인트 통과)
            // 여기서는 간단히 랩 타임이 10초 이상일 때만 랩으로 인정
            if (this.gameState.elapsedTime > (this.lapStartTime || 0) + 10) {
                this.gameState.lap++;
                this.lapStartTime = this.gameState.elapsedTime;
                if (this.gameState.lap > this.gameState.totalLaps) {
                    this.onRaceFinish();
                }
            }
        }
    }

    onRaceFinish() {
        this.gameState.gameOver = true;
        this.gameState.isPlaying = false;
        document.getElementById('finalTime').textContent = this.gameState.elapsedTime.toFixed(2);
        document.getElementById('gameOverScreen').style.display = 'block';
    }

    restartGame() {
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            gameOver: false,
            startTime: 0,
            elapsedTime: 0,
            lap: 1,
            totalLaps: 3,
            lastCheckpoint: -1
        };
        this.carPhysics = new CarPhysics(this.track.width, this.track.height);
        this.carPhysics.setTrack(this.track);
        this.gameEngine.setCameraTarget(this.carPhysics.playerCar);
        document.getElementById('gameOverScreen').style.display = 'none';
        this.startGame();
    }

    updateUI() {
        document.getElementById('lapDisplay').textContent = `${this.gameState.lap}/${this.gameState.totalLaps}`;
        document.getElementById('timeDisplay').textContent = this.gameState.elapsedTime.toFixed(2);
        
        const speed = Math.abs(this.carPhysics.playerCar.speed) * 0.3; // 속도 표시용 변환
        document.getElementById('speedDisplay').textContent = `${speed.toFixed(0)} km/h`;
    }

    render() {
        const renderData = {
            cars: this.carPhysics.getCars(),
            track: this.track
        };
        this.gameEngine.render(renderData);
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.gameEngine.resize(width, height);
    }
}

// 전역 함수
function restartGame() {
    window.game.restartGame();
}

function goToMain() {
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new RacingGame();
});
