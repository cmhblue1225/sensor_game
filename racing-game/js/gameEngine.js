/**
 * 2D 레이싱 게임 엔진
 * 캔버스 렌더링, 카메라, 게임 객체 그리기를 담당
 */
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // 카메라
        this.camera = {
            x: 0,
            y: 0,
            zoom: 0.8, // 약간 축소해서 넓게 보이도록 설정
            followTarget: null,
            lag: 0.1 // 카메라가 타겟을 따라가는 지연 시간
        };
    }

    setCameraTarget(target) {
        this.camera.followTarget = target;
    }

    updateCamera() {
        if (!this.camera.followTarget) return;

        const target = this.camera.followTarget;
        const targetX = target.x - this.width / (2 * this.camera.zoom);
        const targetY = target.y - this.height / (2 * this.camera.zoom);

        // 부드러운 카메라 이동
        this.camera.x += (targetX - this.camera.x) * this.camera.lag;
        this.camera.y += (targetY - this.camera.y) * this.camera.lag;
    }

    render(gameState) {
        this.updateCamera();
        this.clear();

        this.ctx.save();
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        if (gameState.track) this.drawTrack(gameState.track);
        if (gameState.cars) {
            gameState.cars.forEach(car => {
                this.drawCarTrail(car);
                this.drawCar(car);
            });
        }

        this.ctx.restore();
    }

    clear() {
        this.ctx.fillStyle = '#5a6a7a'; // 트랙 바깥 색
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawTrack(track) {
        if (!track || !track.path || track.path.length < 2) return;

        const { path, width } = track;

        // 트랙 노면
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();

        // 출발/결승선
        this.drawFinishLine(track.finishLine);
    }

    drawFinishLine(finishLine) {
        if (!finishLine) return;

        this.ctx.save();
        this.ctx.translate(finishLine.x, finishLine.y);
        this.ctx.rotate(finishLine.angle);

        const TILE_SIZE = 10;
        for (let i = -5; i < 5; i++) {
            for (let j = -1; j < 1; j++) {
                this.ctx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#000';
                this.ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
        this.ctx.restore();
    }

    drawCar(car) {
        this.ctx.save();
        this.ctx.translate(car.x, car.y);
        this.ctx.rotate(car.angle);

        // 자동차 본체
        this.ctx.fillStyle = car.color;
        this.ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

        // 자동차 앞유리
        this.ctx.fillStyle = '#a2d5f2';
        this.ctx.fillRect(-car.width / 2 + 2, -car.height / 2 + 5, car.width - 4, 10);

        // 헤드라이트
        if (car.isPlayer) {
            this.ctx.fillStyle = '#ffdd00';
            this.ctx.fillRect(-car.width / 2, -car.height / 2 - 2, 6, 4);
            this.ctx.fillRect(car.width / 2 - 6, -car.height / 2 - 2, 6, 4);
        }

        this.ctx.restore();
    }

    drawCarTrail(car) {
        if (car.trail.length < 2) return;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        for (let i = 0; i < car.trail.length; i++) {
            const point = car.trail[i];
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        this.ctx.stroke();
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }
}
