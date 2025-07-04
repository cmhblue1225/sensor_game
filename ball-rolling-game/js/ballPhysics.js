/**
 * 볼 물리 시뮬레이션 클래스
 * 2D 물리 엔진으로 공의 움직임, 충돌, 중력 시뮬레이션
 */
class BallPhysics {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // 공 속성
        this.ball = {
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            radius: 15,
            vx: 0,  // x축 속도
            vy: 0,  // y축 속도
            color: '#ff6b6b',
            trail: [] // 궤적 추적
        };
        
        // 물리 상수
        this.physics = {
            gravity: 200,        // 중력 가속도 (픽셀/초²) - 약하게 조정
            friction: 0.98,     // 마찰력
            bounce: 0.7,        // 탄성 계수
            maxSpeed: 300,      // 최대 속도
            tiltForce: 600      // 기울기 힘 - 더 강하게 조정
        };
        
        // 장애물과 목표
        this.obstacles = [];
        this.goals = [];
        this.holes = [];
        
        // 파티클 효과
        this.particles = [];
        
        this.initializeTrail();
    }
    
    /**
     * 궤적 추적 초기화
     */
    initializeTrail() {
        this.ball.trail = [];
        for (let i = 0; i < 20; i++) {
            this.ball.trail.push({
                x: this.ball.x,
                y: this.ball.y,
                alpha: i / 20
            });
        }
    }
    
    /**
     * 물리 업데이트
     */
    update(deltaTime, tiltInput) {
        // 입력값 유효성 검사
        if (!isFinite(deltaTime) || deltaTime <= 0) {
            console.warn('유효하지 않은 deltaTime:', deltaTime);
            return;
        }
        
        // 기울기에 따른 힘 적용
        this.applyTiltForce(tiltInput, deltaTime);
        
        // 중력 적용 (기울기에 따라 조정)
        const gravityMultiplier = 1 - Math.abs(tiltInput.y) * 0.5; // Y축 기울기가 클수록 중력 약화
        this.ball.vy += this.physics.gravity * gravityMultiplier * deltaTime;
        
        // 속도 제한
        this.limitVelocity();
        
        // 위치 업데이트
        this.ball.x += this.ball.vx * deltaTime;
        this.ball.y += this.ball.vy * deltaTime;
        
        // 위치 값 검증
        if (!isFinite(this.ball.x) || !isFinite(this.ball.y)) {
            console.warn('공의 위치가 유효하지 않습니다. 리셋합니다.');
            this.resetBall();
        }
        
        // 벽 충돌 처리
        this.handleWallCollisions();
        
        // 장애물 충돌 처리
        this.handleObstacleCollisions();
        
        // 구멍 충돌 처리
        this.handleHoleCollisions();
        
        // 목표 충돌 처리
        this.handleGoalCollisions();
        
        // 마찰력 적용
        this.ball.vx *= this.physics.friction;
        this.ball.vy *= this.physics.friction;
        
        // 궤적 업데이트
        this.updateTrail();
        
        // 파티클 업데이트
        this.updateParticles(deltaTime);
    }
    
    /**
     * 기울기에 따른 힘 적용
     */
    applyTiltForce(tiltInput, deltaTime) {
        if (!tiltInput) return;
        
        const force = this.physics.tiltForce;
        
        // 좌우 기울기 → 수평 힘
        this.ball.vx += tiltInput.x * force * deltaTime;
        
        // 앞뒤 기울기 → 수직 힘 (중력에 추가/감소)
        this.ball.vy += tiltInput.y * force * deltaTime;
        
        // 디버깅용 출력 (간헐적으로)
        if (Math.random() < 0.01) { // 1% 확률로만 출력
            console.log('기울기 입력:', tiltInput, '속도:', { vx: this.ball.vx.toFixed(2), vy: this.ball.vy.toFixed(2) });
        }
    }
    
    /**
     * 속도 제한
     */
    limitVelocity() {
        const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        if (speed > this.physics.maxSpeed) {
            const ratio = this.physics.maxSpeed / speed;
            this.ball.vx *= ratio;
            this.ball.vy *= ratio;
        }
    }
    
    /**
     * 벽 충돌 처리
     */
    handleWallCollisions() {
        const radius = this.ball.radius;
        
        // 좌우 벽 충돌
        if (this.ball.x - radius < 0) {
            this.ball.x = radius;
            this.ball.vx = -this.ball.vx * this.physics.bounce;
            this.createCollisionParticles(this.ball.x, this.ball.y);
        } else if (this.ball.x + radius > this.canvasWidth) {
            this.ball.x = this.canvasWidth - radius;
            this.ball.vx = -this.ball.vx * this.physics.bounce;
            this.createCollisionParticles(this.ball.x, this.ball.y);
        }
        
        // 상하 벽 충돌
        if (this.ball.y - radius < 0) {
            this.ball.y = radius;
            this.ball.vy = -this.ball.vy * this.physics.bounce;
            this.createCollisionParticles(this.ball.x, this.ball.y);
        } else if (this.ball.y + radius > this.canvasHeight) {
            this.ball.y = this.canvasHeight - radius;
            this.ball.vy = -this.ball.vy * this.physics.bounce;
            this.createCollisionParticles(this.ball.x, this.ball.y);
        }
    }
    
    /**
     * 장애물 충돌 처리
     */
    handleObstacleCollisions() {
        for (const obstacle of this.obstacles) {
            if (this.isCollidingWithRect(this.ball, obstacle)) {
                this.resolveRectCollision(this.ball, obstacle);
                this.createCollisionParticles(this.ball.x, this.ball.y);
                break;
            }
        }
    }
    
    /**
     * 구멍 충돌 처리
     */
    handleHoleCollisions() {
        for (const hole of this.holes) {
            const dx = this.ball.x - hole.x;
            const dy = this.ball.y - hole.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < hole.radius) {
                // 구멍에 빠짐 - 게임 오버
                this.onBallFellInHole();
                return true;
            }
        }
        return false;
    }
    
    /**
     * 목표 충돌 처리
     */
    handleGoalCollisions() {
        for (let i = this.goals.length - 1; i >= 0; i--) {
            const goal = this.goals[i];
            const dx = this.ball.x - goal.x;
            const dy = this.ball.y - goal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < goal.radius + this.ball.radius) {
                // 목표 달성
                this.onGoalReached(goal, i);
                return true;
            }
        }
        return false;
    }
    
    /**
     * 원과 사각형 충돌 검사
     */
    isCollidingWithRect(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        
        return (dx * dx + dy * dy) < (circle.radius * circle.radius);
    }
    
    /**
     * 사각형과의 충돌 해결
     */
    resolveRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            // 공을 장애물 밖으로 밀어냄
            const overlap = circle.radius - distance;
            circle.x += normalX * overlap;
            circle.y += normalY * overlap;
            
            // 속도 반사
            const dotProduct = circle.vx * normalX + circle.vy * normalY;
            circle.vx -= 2 * dotProduct * normalX * this.physics.bounce;
            circle.vy -= 2 * dotProduct * normalY * this.physics.bounce;
        }
    }
    
    /**
     * 궤적 업데이트
     */
    updateTrail() {
        // 새로운 위치를 궤적에 추가
        this.ball.trail.unshift({
            x: this.ball.x,
            y: this.ball.y,
            alpha: 1.0
        });
        
        // 궤적 길이 제한
        if (this.ball.trail.length > 20) {
            this.ball.trail.pop();
        }
        
        // 알파값 감소
        for (let i = 0; i < this.ball.trail.length; i++) {
            this.ball.trail[i].alpha = (20 - i) / 20;
        }
    }
    
    /**
     * 충돌 파티클 생성
     */
    createCollisionParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                size: 2 + Math.random() * 3,
                color: `hsl(${Math.random() * 60 + 10}, 100%, 60%)`
            });
        }
    }
    
    /**
     * 파티클 업데이트
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 위치 업데이트
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // 중력 적용
            particle.vy += this.physics.gravity * 0.5 * deltaTime;
            
            // 수명 감소
            particle.life -= deltaTime * 2;
            
            // 마찰
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // 수명이 다한 파티클 제거
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 레벨 설정
     */
    setLevel(levelData) {
        this.obstacles = levelData.obstacles || [];
        this.goals = levelData.goals || [];
        this.holes = levelData.holes || [];
        
        // 공 위치 리셋
        this.resetBall(levelData.startX, levelData.startY);
    }
    
    /**
     * 공 위치 리셋
     */
    resetBall(x = this.canvasWidth / 2, y = this.canvasHeight / 2) {
        // 유효성 검사
        if (!isFinite(x) || !isFinite(y)) {
            console.warn('유효하지 않은 공 위치:', x, y);
            x = this.canvasWidth / 2;
            y = this.canvasHeight / 2;
        }
        
        this.ball.x = x;
        this.ball.y = y;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.initializeTrail();
        this.particles = [];
        
        console.log('공 위치 리셋됨:', { x: this.ball.x, y: this.ball.y, radius: this.ball.radius });
    }
    
    /**
     * 구멍에 빠진 경우 콜백
     */
    onBallFellInHole() {
        if (this.onGameOver) {
            this.onGameOver('hole');
        }
    }
    
    /**
     * 목표 달성 콜백
     */
    onGoalReached(goal, index) {
        // 목표 제거
        this.goals.splice(index, 1);
        
        // 효과 파티클 생성
        this.createGoalParticles(goal.x, goal.y);
        
        if (this.onGoalCallback) {
            this.onGoalCallback(goal);
        }
    }
    
    /**
     * 목표 달성 파티클 생성
     */
    createGoalParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.5,
                maxLife: 1.5,
                size: 3 + Math.random() * 4,
                color: `hsl(${120 + Math.random() * 60}, 100%, 60%)`
            });
        }
    }
    
    /**
     * 공 정보 반환
     */
    getBall() {
        return this.ball;
    }
    
    /**
     * 파티클 정보 반환
     */
    getParticles() {
        return this.particles;
    }
    
    /**
     * 모든 목표가 달성되었는지 확인
     */
    allGoalsReached() {
        return this.goals.length === 0;
    }
}