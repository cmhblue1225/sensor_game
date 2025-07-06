/**
 * 자동차 물리 시뮬레이션 클래스
 */
class CarPhysics {
    constructor(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // 플레이어 자동차 속성
        this.playerCar = this.createCar(worldWidth / 2, worldHeight - 100, '#ff6b6b', true);

        // AI 자동차들
        this.aiCars = [
            this.createCar(worldWidth / 2 - 50, worldHeight - 200, '#4ecdc4'),
            this.createCar(worldWidth / 2 + 50, worldHeight - 200, '#45b7d1'),
            this.createCar(worldWidth / 2 - 100, worldHeight - 300, '#feca57'),
        ];

        // 물리 상수
        this.physics = {
            engineForce: 2000,      // 엔진 힘 (가속도)
            friction: 0.98,         // 주행 저항
            drag: 0.99,             // 공기 저항 (속도가 높을 때)
            turnSpeed: 0.15,        // 조향 속도
            maxSpeed: 800,          // 최고 속도
            maxReverseSpeed: -200,  // 최고 후진 속도
            offTrackFriction: 0.8,  // 트랙 벗어났을 때 마찰
        };

        this.track = null; // 트랙 데이터
    }

    createCar(x, y, color, isPlayer = false) {
        return {
            x: x,
            y: y,
            width: 20,
            height: 40,
            angle: 0, // 0: 위쪽, PI: 아래쪽
            vx: 0,
            vy: 0,
            speed: 0,
            color: color,
            isPlayer: isPlayer,
            trail: [],
            // AI 관련 속성
            ai: {
                targetX: x,
                targetY: y,
                steering: 0,
                acceleration: 1, // 항상 가속
            }
        };
    }

    setTrack(track) {
        this.track = track;
    }

    update(deltaTime, tiltInput) {
        if (!isFinite(deltaTime) || deltaTime <= 0) return;

        // 플레이어 자동차 업데이트
        this.updateCar(this.playerCar, deltaTime, tiltInput);

        // AI 자동차 업데이트
        this.aiCars.forEach(car => {
            this.updateAiCar(car, deltaTime);
            this.updateCar(car, deltaTime, car.ai);
        });

        // 자동차 간 충돌 처리
        this.handleCarCollisions();
    }

    updateCar(car, deltaTime, input) {
        // 1. 입력에 따른 가속/감속
        const accelerationInput = input.y; // 앞뒤 기울기 또는 AI 입력
        const steeringInput = input.x;     // 좌우 기울기 또는 AI 입력

        // 가속
        if (accelerationInput < -0.1) { // 앞으로 기울임
            car.speed += this.physics.engineForce * Math.abs(accelerationInput) * deltaTime;
        } 
        // 감속/후진
        else if (accelerationInput > 0.1) { // 뒤로 기울임
            car.speed -= this.physics.engineForce * Math.abs(accelerationInput) * deltaTime * 0.7; // 후진은 더 약하게
        }

        // 2. 조향
        if (car.speed !== 0) {
            const turnRate = this.physics.turnSpeed * (1 - Math.abs(car.speed / this.physics.maxSpeed) * 0.5);
            car.angle += steeringInput * turnRate * (car.speed > 0 ? 1 : -1); // 후진 시 조향 반대
        }

        // 3. 저항 적용
        car.speed *= this.physics.friction;

        // 4. 속도 제한
        car.speed = Math.max(this.physics.maxReverseSpeed, Math.min(car.speed, this.physics.maxSpeed));
        if (Math.abs(car.speed) < 0.5) car.speed = 0;

        // 5. 속도를 벡터로 변환
        car.vx = Math.sin(car.angle) * car.speed;
        car.vy = -Math.cos(car.angle) * car.speed;

        // 6. 위치 업데이트
        car.x += car.vx * deltaTime;
        car.y += car.vy * deltaTime;

        // 7. 트랙 경계 처리
        this.handleTrackBoundaries(car);

        // 8. 궤적 업데이트
        this.updateTrail(car);
    }

    updateAiCar(car, deltaTime) {
        // 간단한 AI: 트랙의 다음 지점을 따라가도록 함
        if (!this.track || this.track.path.length < 2) return;

        // 가장 가까운 트랙 포인트 찾기
        let closestPointIndex = -1;
        let minDistance = Infinity;
        for (let i = 0; i < this.track.path.length; i++) {
            const point = this.track.path[i];
            const distance = Math.hypot(car.x - point.x, car.y - point.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestPointIndex = i;
            }
        }

        // 다음 목표 지점 설정 (몇 포인트 앞)
        const targetPointIndex = (closestPointIndex + 15) % this.track.path.length;
        const targetPoint = this.track.path[targetPointIndex];

        // 목표 지점을 향하도록 조향 계산
        const targetAngle = Math.atan2(targetPoint.x - car.x, -(targetPoint.y - car.y));
        let angleDiff = targetAngle - car.angle;

        // 각도 차이 정규화 (-PI ~ PI)
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // AI 조향 및 가속 설정
        car.ai.steering = Math.max(-1, Math.min(1, angleDiff * 2));
        car.ai.y = -1; // 항상 가속
        car.ai.x = car.ai.steering;
    }

    handleTrackBoundaries(car) {
        if (!this.track) return;

        const onTrack = this.track.isPointOnTrack(car.x, car.y);
        if (!onTrack) {
            car.speed *= this.physics.offTrackFriction;

            // 트랙 안으로 되돌리는 힘 (간단하게)
            const closestPoint = this.track.getClosestPoint(car.x, car.y);
            const dx = closestPoint.x - car.x;
            const dy = closestPoint.y - car.y;
            car.x += dx * 0.05;
            car.y += dy * 0.05;
        }
    }

    handleCarCollisions() {
        const allCars = [this.playerCar, ...this.aiCars];
        for (let i = 0; i < allCars.length; i++) {
            for (let j = i + 1; j < allCars.length; j++) {
                const carA = allCars[i];
                const carB = allCars[j];

                const dx = carB.x - carA.x;
                const dy = carB.y - carA.y;
                const distance = Math.hypot(dx, dy);

                if (distance < (carA.height + carB.height) / 2) { // 간단한 원형 충돌
                    this.resolveCollision(carA, carB, dx, dy, distance);
                }
            }
        }
    }

    resolveCollision(carA, carB, dx, dy, distance) {
        const overlap = ((carA.height + carB.height) / 2 - distance) * 0.5;
        const nx = dx / distance;
        const ny = dy / distance;

        // 위치 보정
        carA.x -= nx * overlap;
        carA.y -= ny * overlap;
        carB.x += nx * overlap;
        carB.y += ny * overlap;

        // 속도 교환 (간단한 탄성 충돌)
        const tempSpeedA = carA.speed;
        carA.speed = carB.speed * 0.8; // 약간의 에너지 손실
        carB.speed = tempSpeedA * 0.8;
    }

    updateTrail(car) {
        car.trail.unshift({ x: car.x, y: car.y });
        if (car.trail.length > 30) {
            car.trail.pop();
        }
    }

    getCars() {
        return [this.playerCar, ...this.aiCars];
    }
}
