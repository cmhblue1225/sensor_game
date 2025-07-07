/**
 * 충돌 감지 및 타격 판정 시스템
 * 배트와 공의 충돌을 정밀하게 감지하고 타격을 판정
 */

class CollisionDetector {
    constructor(batController, ballPhysics) {
        this.batController = batController;
        this.ballPhysics = ballPhysics;
        
        // 충돌 감지 설정 (더 관대하게)
        this.collisionThreshold = 1.2; // 충돌 감지 거리 (0.3 → 1.2로 4배 증가)
        this.hitWindow = 300; // 타격 타이밍 윈도우 (100ms → 300ms로 3배 증가)
        this.perfectTiming = 150; // 완벽한 타이밍 윈도우 (50ms → 150ms로 3배 증가)
        
        // 타격 존 설정 (홈플레이트 근처) - 더 크게 확장
        this.strikeZone = {
            center: new THREE.Vector3(0, 2, -2),
            width: 3.0,  // 1.5 → 3.0으로 2배 증가
            height: 3.0, // 2 → 3.0으로 1.5배 증가  
            depth: 2.0   // 0.5 → 2.0으로 4배 증가
        };
        
        // 충돌 감지 상태
        this.isMonitoring = false;
        this.lastCollisionTime = 0;
        this.collisionCooldown = 200; // 중복 충돌 방지 (밀리초)
        
        // 디버그 시각화
        this.debugMode = false;
        this.debugObjects = [];
        
        this.init();
    }
    
    /**
     * 충돌 감지 시스템 초기화
     */
    init() {
        this.setupEventListeners();
        this.startCollisionDetection();
        
        if (this.debugMode) {
            this.createDebugVisuals();
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 배트 스윙 이벤트
        document.addEventListener('batSwing', (event) => {
            this.handleBatSwing(event.detail);
        });
        
        // 투구 이벤트
        document.addEventListener('pitchThrown', () => {
            this.isMonitoring = true;
        });
        
        // 게임 종료 이벤트
        document.addEventListener('gameEnd', () => {
            this.isMonitoring = false;
        });
        
        // 디버그 모드 토글 (D키)
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyD') {
                this.toggleDebugMode();
            }
        });
    }
    
    /**
     * 충돌 감지 루프 시작
     */
    startCollisionDetection() {
        const detectCollisions = () => {
            if (this.isMonitoring) {
                this.updateCollisionDetection();
            }
            requestAnimationFrame(detectCollisions);
        };
        
        detectCollisions();
    }
    
    /**
     * 매 프레임 충돌 감지 업데이트
     */
    updateCollisionDetection() {
        const activeBalls = this.ballPhysics.getActiveBalls();
        const batPosition = this.batController.getBatPosition();
        const isSwinging = this.batController.getIsSwinging();
        
        activeBalls.forEach(ball => {
            if (!ball.isHit && this.isInStrikeZone(ball)) {
                const distance = this.calculateBatBallDistance(ball, batPosition);
                
                // 더 관대한 판정: 스윙 중이거나 공이 가까이 있으면 히트
                if (distance <= this.collisionThreshold) {
                    // 스윙 중이 아니어도 배트가 충분히 가까우면 히트로 판정
                    this.handleCollision(ball);
                } else if (distance <= this.collisionThreshold * 1.5 && isSwinging) {
                    // 스윙 중일 때는 더 먼 거리에서도 히트 판정
                    this.handleCollision(ball);
                }
            }
        });
    }
    
    /**
     * 배트 스윙 처리
     */
    handleBatSwing(swingData) {
        if (!this.isMonitoring) return;
        
        const activeBalls = this.ballPhysics.getActiveBalls();
        let hitDetected = false;
        
        activeBalls.forEach(ball => {
            if (!ball.isHit && this.isInStrikeZone(ball)) {
                const distance = this.calculateBatBallDistance(ball, swingData.position);
                const timing = this.calculateSwingTiming(ball, swingData);
                
                // 더 관대한 히트 판정
                if (distance <= this.collisionThreshold * 2.0 || timing.isInWindow) {
                    // 거리나 타이밍 중 하나만 맞아도 히트
                    this.processHit(ball, swingData, timing);
                    hitDetected = true;
                }
            }
        });
        
        if (!hitDetected) {
            this.processSwingAndMiss(swingData);
        }
    }
    
    /**
     * 배트와 공의 거리 계산
     */
    calculateBatBallDistance(ball, batPosition) {
        return ball.position.distanceTo(batPosition);
    }
    
    /**
     * 스윙 타이밍 계산
     */
    calculateSwingTiming(ball, swingData) {
        const ballToPlate = this.strikeZone.center.distanceTo(ball.position);
        const ballSpeed = ball.velocity.length();
        const timeToPlate = ballToPlate / ballSpeed * 1000; // 밀리초
        
        const timing = {
            timeToPlate: timeToPlate,
            isInWindow: timeToPlate <= this.hitWindow,
            isPerfect: timeToPlate <= this.perfectTiming,
            earlyLate: timeToPlate < this.perfectTiming ? 'perfect' : 
                      timeToPlate < this.hitWindow ? 'good' : 'late'
        };
        
        return timing;
    }
    
    /**
     * 스트라이크 존 내 확인
     */
    isInStrikeZone(ball) {
        const pos = ball.position;
        const zone = this.strikeZone;
        
        return pos.x >= zone.center.x - zone.width/2 &&
               pos.x <= zone.center.x + zone.width/2 &&
               pos.y >= zone.center.y - zone.height/2 &&
               pos.y <= zone.center.y + zone.height/2 &&
               pos.z >= zone.center.z - zone.depth/2 &&
               pos.z <= zone.center.z + zone.depth/2;
    }
    
    /**
     * 충돌 처리
     */
    handleCollision(ball) {
        const currentTime = Date.now();
        
        // 쿨다운 체크
        if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
            return;
        }
        
        this.lastCollisionTime = currentTime;
        
        // 기본 타격 데이터
        const hitData = {
            power: this.batController.getSwingPower(),
            speed: 0.8,
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                0.3 + Math.random() * 0.3,
                1
            ).normalize(),
            timing: 'auto'
        };
        
        this.processHit(ball, hitData, { isPerfect: true, earlyLate: 'perfect' });
    }
    
    /**
     * 타격 처리
     */
    processHit(ball, swingData, timing) {
        // 타격 파워 계산
        const basePower = swingData.power || 0.5;
        const timingMultiplier = timing.isPerfect ? 1.5 : timing.earlyLate === 'good' ? 1.2 : 1.0;
        const finalPower = Math.min(basePower * timingMultiplier, 1.0);
        
        // 타격 방향 계산
        const hitDirection = this.calculateHitDirection(ball, swingData, timing);
        
        // 타격 데이터 생성
        const hitData = {
            power: finalPower,
            speed: swingData.speed || 0.8,
            direction: hitDirection,
            timing: timing.earlyLate,
            contact: this.calculateContactQuality(ball, swingData)
        };
        
        // 공에 타격 적용
        this.ballPhysics.hitBall(ball, hitData);
        
        // 타격 이벤트 발생
        this.dispatchHitEvent(ball, hitData, timing);
        
        // 시각 효과
        this.createHitEffect(ball.position);
        
        // 모니터링 잠시 중단 (한 번에 하나의 공만 타격)
        this.isMonitoring = false;
        setTimeout(() => {
            this.isMonitoring = true;
        }, 500);
    }
    
    /**
     * 타격 방향 계산
     */
    calculateHitDirection(ball, swingData, timing) {
        const baseDirection = new THREE.Vector3(0, 0.3, 1);
        
        // 타이밍에 따른 방향 조정
        switch (timing.earlyLate) {
            case 'perfect':
                // 중앙으로 정확히
                baseDirection.x = 0;
                break;
            case 'good':
                // 약간의 편차
                baseDirection.x = (Math.random() - 0.5) * 0.3;
                break;
            case 'late':
                // 오른쪽으로 편향
                baseDirection.x = 0.2 + Math.random() * 0.3;
                break;
        }
        
        // 스윙 방향 반영
        if (swingData.direction) {
            baseDirection.add(swingData.direction.clone().multiplyScalar(0.2));
        }
        
        return baseDirection.normalize();
    }
    
    /**
     * 접촉 품질 계산
     */
    calculateContactQuality(ball, swingData) {
        const power = swingData.power || 0.5;
        const speed = swingData.speed || 0.5;
        
        // 파워와 스피드를 조합하여 접촉 품질 결정
        const quality = (power + speed) / 2;
        
        if (quality >= 0.9) return 'perfect';
        if (quality >= 0.7) return 'good';
        if (quality >= 0.5) return 'fair';
        return 'poor';
    }
    
    /**
     * 스윙 미스 처리
     */
    processSwingAndMiss(swingData) {
        // 미스 이벤트 발생
        const missEvent = new CustomEvent('swingAndMiss', {
            detail: {
                swingData: swingData,
                reason: 'missed'
            }
        });
        
        document.dispatchEvent(missEvent);
    }
    
    /**
     * 놓친 스윙 처리 (공이 지나갔는데 스윙하지 않음)
     */
    handleMissedSwing(ball) {
        if (ball.position.z < this.strikeZone.center.z - this.strikeZone.depth) {
            // 스트라이크 이벤트 발생
            const strikeEvent = new CustomEvent('strike', {
                detail: {
                    ball: ball,
                    reason: 'no_swing'
                }
            });
            
            document.dispatchEvent(strikeEvent);
            
            ball.isHit = true; // 처리 완료 마킹
        }
    }
    
    /**
     * 타격 이벤트 발생
     */
    dispatchHitEvent(ball, hitData, timing) {
        const hitEvent = new CustomEvent('baseballHit', {
            detail: {
                ball: ball,
                hitData: hitData,
                timing: timing,
                position: ball.position.clone(),
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(hitEvent);
    }
    
    /**
     * 타격 효과 생성
     */
    createHitEffect(position) {
        // 파티클 효과 생성
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // 랜덤 방향으로 파티클 이동
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10,
                (Math.random() - 0.5) * 10
            );
            
            particles.push({ mesh: particle, velocity: velocity });
            this.batController.engine.addToScene(particle);
        }
        
        // 파티클 애니메이션
        this.animateParticles(particles);
    }
    
    /**
     * 파티클 애니메이션
     */
    animateParticles(particles) {
        const duration = 1000; // 1초
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                particles.forEach(particle => {
                    particle.mesh.position.add(
                        particle.velocity.clone().multiplyScalar(0.01)
                    );
                    particle.velocity.multiplyScalar(0.98); // 감속
                    particle.mesh.material.opacity = 1 - progress;
                });
                
                requestAnimationFrame(animate);
            } else {
                // 파티클 제거
                particles.forEach(particle => {
                    this.batController.engine.removeFromScene(particle.mesh);
                    particle.mesh.geometry.dispose();
                    particle.mesh.material.dispose();
                });
            }
        };
        
        animate();
    }
    
    /**
     * 디버그 모드 토글
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            this.createDebugVisuals();
        } else {
            this.removeDebugVisuals();
        }
        
        console.log(`충돌 감지 디버그 모드: ${this.debugMode ? '활성' : '비활성'}`);
    }
    
    /**
     * 디버그 시각화 생성
     */
    createDebugVisuals() {
        // 스트라이크 존 시각화
        const zoneGeometry = new THREE.BoxGeometry(
            this.strikeZone.width,
            this.strikeZone.height,
            this.strikeZone.depth
        );
        const zoneMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        
        const zoneBox = new THREE.Mesh(zoneGeometry, zoneMaterial);
        zoneBox.position.copy(this.strikeZone.center);
        
        this.debugObjects.push(zoneBox);
        this.batController.engine.addToScene(zoneBox);
    }
    
    /**
     * 디버그 시각화 제거
     */
    removeDebugVisuals() {
        this.debugObjects.forEach(obj => {
            this.batController.engine.removeFromScene(obj);
            obj.geometry.dispose();
            obj.material.dispose();
        });
        
        this.debugObjects = [];
    }
    
    /**
     * 충돌 감지 활성화/비활성화
     */
    setMonitoring(enabled) {
        this.isMonitoring = enabled;
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        this.isMonitoring = false;
        this.removeDebugVisuals();
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.CollisionDetector = CollisionDetector;
}