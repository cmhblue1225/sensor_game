/**
 * 야구공 물리학 시스템
 * 현실적인 공의 움직임과 물리 법칙 구현
 */

class BallPhysics {
    constructor(engine) {
        this.engine = engine;
        
        // 물리 상수
        this.gravity = -9.8;
        this.airResistance = 0.98;
        this.groundFriction = 0.7;
        this.bounceFactor = 0.3;
        
        // 공 속성
        this.ballRadius = 0.075; // 야구공 크기
        this.ballMass = 0.145;   // 야구공 무게 (kg)
        
        // 활성 공들
        this.balls = [];
        
        this.init();
    }
    
    /**
     * 물리 시스템 초기화
     */
    init() {
        // 물리 업데이트 루프 시작
        this.startPhysicsLoop();
    }
    
    /**
     * 새로운 공 생성
     */
    createBall(startPosition, velocity, pitchType = 'fastball') {
        // 3D 공 모델 생성
        const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
        const ballMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff,
            map: this.createBallTexture()
        });
        
        const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        ballMesh.position.copy(startPosition);
        ballMesh.castShadow = true;
        
        // 공 객체 생성
        const ball = {
            id: Date.now() + Math.random(),
            mesh: ballMesh,
            position: startPosition.clone(),
            velocity: velocity.clone(),
            acceleration: new THREE.Vector3(0, this.gravity, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            
            // 공 상태
            isActive: true,
            isHit: false,
            isGrounded: false,
            timeInFlight: 0,
            
            // 투구 정보
            pitchType: pitchType,
            initialVelocity: velocity.length(),
            
            // 물리 속성
            mass: this.ballMass,
            radius: this.ballRadius,
            
            // 스핀 효과 (투구 타입에 따라)
            spin: this.calculateSpin(pitchType, velocity)
        };
        
        // 씬에 추가
        this.engine.addToScene(ballMesh);
        this.balls.push(ball);
        
        return ball;
    }
    
    /**
     * 공 텍스처 생성
     */
    createBallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 흰색 배경
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, 128, 128);
        
        // 빨간 실밥
        context.strokeStyle = '#ff0000';
        context.lineWidth = 2;
        
        // 실밥 그리기
        context.beginPath();
        context.arc(64, 64, 50, Math.PI * 0.2, Math.PI * 0.8);
        context.stroke();
        
        context.beginPath();
        context.arc(64, 64, 50, Math.PI * 1.2, Math.PI * 1.8);
        context.stroke();
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    /**
     * 투구 타입에 따른 스핀 계산
     */
    calculateSpin(pitchType, velocity) {
        const speed = velocity.length();
        
        switch (pitchType) {
            case 'fastball':
                return new THREE.Vector3(0, 0, speed * 0.3);
                
            case 'curveball':
                return new THREE.Vector3(speed * 0.4, 0, -speed * 0.2);
                
            case 'slider':
                return new THREE.Vector3(speed * 0.2, speed * 0.3, 0);
                
            case 'changeup':
                return new THREE.Vector3(0, 0, speed * 0.1);
                
            case 'knuckleball':
                return new THREE.Vector3(
                    (Math.random() - 0.5) * speed * 0.1,
                    (Math.random() - 0.5) * speed * 0.1,
                    (Math.random() - 0.5) * speed * 0.1
                );
                
            default:
                return new THREE.Vector3(0, 0, 0);
        }
    }
    
    /**
     * 물리 업데이트 루프
     */
    startPhysicsLoop() {
        let lastTime = Date.now();
        
        const updatePhysics = () => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastTime) / 1000; // 초 단위
            lastTime = currentTime;
            
            this.updateBalls(deltaTime);
            
            requestAnimationFrame(updatePhysics);
        };
        
        updatePhysics();
    }
    
    /**
     * 모든 공의 물리 업데이트
     */
    updateBalls(deltaTime) {
        this.balls.forEach((ball, index) => {
            if (ball.isActive) {
                this.updateBallPhysics(ball, deltaTime);
                this.updateBallPosition(ball, deltaTime);
                this.checkBoundaries(ball);
                
                // 비활성 공 제거
                if (!ball.isActive) {
                    this.removeBall(index);
                }
            }
        });
    }
    
    /**
     * 개별 공의 물리 업데이트
     */
    updateBallPhysics(ball, deltaTime) {
        ball.timeInFlight += deltaTime;
        
        // 중력 적용
        ball.acceleration.y = this.gravity;
        
        // 공기 저항 적용
        const speed = ball.velocity.length();
        if (speed > 0) {
            const dragForce = speed * speed * 0.001; // 간단한 공기저항 모델
            const dragDirection = ball.velocity.clone().normalize().multiplyScalar(-dragForce);
            ball.acceleration.add(dragDirection);
        }
        
        // 스핀 효과 적용
        this.applySpinEffect(ball, deltaTime);
        
        // 속도 업데이트
        ball.velocity.add(ball.acceleration.clone().multiplyScalar(deltaTime));
        
        // 공기 저항으로 인한 속도 감소
        ball.velocity.multiplyScalar(this.airResistance);
        
        // 회전 업데이트
        ball.rotation.x += ball.angularVelocity.x * deltaTime;
        ball.rotation.y += ball.angularVelocity.y * deltaTime;
        ball.rotation.z += ball.angularVelocity.z * deltaTime;
    }
    
    /**
     * 스핀 효과 적용
     */
    applySpinEffect(ball, deltaTime) {
        // 마그누스 효과 (스핀으로 인한 공의 궤적 변화)
        const magnusForce = new THREE.Vector3();
        
        // 스핀과 속도의 외적으로 마그누스 힘 계산
        magnusForce.crossVectors(ball.spin, ball.velocity);
        magnusForce.multiplyScalar(0.0001); // 마그누스 계수
        
        ball.acceleration.add(magnusForce);
        
        // 공의 회전 업데이트
        ball.angularVelocity = ball.spin.clone().multiplyScalar(0.1);
    }
    
    /**
     * 공 위치 업데이트
     */
    updateBallPosition(ball, deltaTime) {
        // 위치 업데이트
        ball.position.add(ball.velocity.clone().multiplyScalar(deltaTime));
        
        // 메시 위치 업데이트
        ball.mesh.position.copy(ball.position);
        ball.mesh.rotation.copy(ball.rotation);
        
        // 그라운드 충돌 체크
        this.checkGroundCollision(ball);
    }
    
    /**
     * 그라운드 충돌 처리
     */
    checkGroundCollision(ball) {
        if (ball.position.y <= ball.radius && !ball.isGrounded) {
            // 바운스
            ball.position.y = ball.radius;
            ball.velocity.y = -ball.velocity.y * this.bounceFactor;
            
            // 지면 마찰
            ball.velocity.x *= this.groundFriction;
            ball.velocity.z *= this.groundFriction;
            
            // 낮은 속도면 그라운드에 멈춤
            if (Math.abs(ball.velocity.y) < 0.5) {
                ball.isGrounded = true;
                ball.velocity.y = 0;
            }
            
            // 바운드 이벤트 발생
            this.dispatchBounceEvent(ball);
        }
    }
    
    /**
     * 경계 체크
     */
    checkBoundaries(ball) {
        // 야구장 경계 (대략적)
        const boundary = 100;
        
        if (Math.abs(ball.position.x) > boundary || 
            Math.abs(ball.position.z) > boundary || 
            ball.position.y < -10) {
            
            ball.isActive = false;
            this.dispatchBallOutEvent(ball);
        }
        
        // 타격 존 체크 (홈플레이트 근처)
        if (ball.position.z <= -1 && ball.position.z >= -3 && 
            Math.abs(ball.position.x) <= 2 && 
            ball.position.y >= 0.5 && ball.position.y <= 4) {
            
            this.dispatchStrikeZoneEvent(ball);
        }
    }
    
    /**
     * 공에 타격 적용
     */
    hitBall(ball, hitData) {
        if (ball.isHit) return;
        
        ball.isHit = true;
        
        // 타격 방향과 파워에 따른 새로운 속도 계산
        const hitDirection = hitData.direction || new THREE.Vector3(0, 0.3, 1);
        const hitPower = hitData.power || 0.5;
        const batSpeed = hitData.speed || 0.5;
        
        // 새로운 속도 계산
        const newVelocity = hitDirection.clone().normalize();
        newVelocity.multiplyScalar(hitPower * batSpeed * 30); // 타격 속도
        
        // 공의 원래 속도와 조합
        ball.velocity.add(newVelocity);
        
        // 타격으로 인한 새로운 스핀
        ball.spin.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            hitPower * 5
        );
        
        // 공 색상 변경 (타격 피드백)
        ball.mesh.material.color.setHex(0xffff00);
        setTimeout(() => {
            ball.mesh.material.color.setHex(0xffffff);
        }, 200);
        
        // 타격 이벤트 발생
        this.dispatchHitEvent(ball, hitData);
    }
    
    /**
     * 바운스 이벤트 발생
     */
    dispatchBounceEvent(ball) {
        const bounceEvent = new CustomEvent('ballBounce', {
            detail: { ball, position: ball.position.clone() }
        });
        document.dispatchEvent(bounceEvent);
    }
    
    /**
     * 공 장외 이벤트 발생
     */
    dispatchBallOutEvent(ball) {
        const outEvent = new CustomEvent('ballOut', {
            detail: { ball, position: ball.position.clone() }
        });
        document.dispatchEvent(outEvent);
    }
    
    /**
     * 스트라이크 존 이벤트 발생
     */
    dispatchStrikeZoneEvent(ball) {
        const strikeEvent = new CustomEvent('ballInStrikeZone', {
            detail: { 
                ball, 
                position: ball.position.clone(),
                velocity: ball.velocity.clone()
            }
        });
        document.dispatchEvent(strikeEvent);
    }
    
    /**
     * 타격 이벤트 발생
     */
    dispatchHitEvent(ball, hitData) {
        const hitEvent = new CustomEvent('ballHit', {
            detail: { 
                ball, 
                hitData,
                position: ball.position.clone(),
                velocity: ball.velocity.clone()
            }
        });
        document.dispatchEvent(hitEvent);
    }
    
    /**
     * 공 제거
     */
    removeBall(index) {
        const ball = this.balls[index];
        if (ball && ball.mesh) {
            this.engine.removeFromScene(ball.mesh);
            
            // 메모리 정리
            ball.mesh.geometry.dispose();
            ball.mesh.material.dispose();
        }
        
        this.balls.splice(index, 1);
    }
    
    /**
     * 모든 공 제거
     */
    clearAllBalls() {
        while (this.balls.length > 0) {
            this.removeBall(0);
        }
    }
    
    /**
     * 활성 공 가져오기
     */
    getActiveBalls() {
        return this.balls.filter(ball => ball.isActive);
    }
    
    /**
     * 특정 공 가져오기
     */
    getBallById(id) {
        return this.balls.find(ball => ball.id === id);
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        this.clearAllBalls();
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.BallPhysics = BallPhysics;
}