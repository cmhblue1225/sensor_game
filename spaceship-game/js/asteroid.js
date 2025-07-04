/**
 * 소행성 클래스
 * 게임 장애물 및 수집 아이템
 */
class Asteroid {
    constructor(scene, position, size = 1, type = 'obstacle') {
        this.scene = scene;
        this.position = position.clone();
        this.size = size;
        this.type = type; // 'obstacle', 'fuel', 'health', 'bonus'
        
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        this.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        this.mesh = null;
        this.boundingSphere = new THREE.Sphere(this.position, this.size);
        this.isDestroyed = false;
        this.glowEffect = null;
        
        this.createMesh();
    }
    
    /**
     * 소행성 메시 생성
     */
    createMesh() {
        let geometry, material;
        
        switch (this.type) {
            case 'obstacle':
                geometry = this.createAsteroidGeometry();
                material = new THREE.MeshPhongMaterial({
                    color: 0x666666,
                    shininess: 30,
                    transparent: false
                });
                break;
                
            case 'fuel':
                geometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
                material = new THREE.MeshPhongMaterial({
                    color: 0x00ff88,
                    emissive: 0x004422,
                    emissiveIntensity: 0.3,
                    shininess: 100
                });
                this.createGlowEffect(0x00ff88);
                break;
                
            case 'health':
                geometry = new THREE.SphereGeometry(1, 12, 12);
                material = new THREE.MeshPhongMaterial({
                    color: 0xff4488,
                    emissive: 0x441122,
                    emissiveIntensity: 0.3,
                    shininess: 100
                });
                this.createGlowEffect(0xff4488);
                break;
                
            case 'bonus':
                geometry = new THREE.OctahedronGeometry(1.2);
                material = new THREE.MeshPhongMaterial({
                    color: 0xffaa00,
                    emissive: 0x442200,
                    emissiveIntensity: 0.4,
                    shininess: 120
                });
                this.createGlowEffect(0xffaa00);
                break;
                
            default:
                geometry = this.createAsteroidGeometry();
                material = new THREE.MeshPhongMaterial({
                    color: 0x666666,
                    shininess: 30
                });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.scale.setScalar(this.size);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.scene.add(this.mesh);
    }
    
    /**
     * 불규칙한 소행성 지오메트리 생성
     */
    createAsteroidGeometry() {
        const geometry = new THREE.SphereGeometry(1, 8, 6);
        const positions = geometry.attributes.position.array;
        
        // 정점들을 무작위로 변형하여 불규칙한 모양 생성
        for (let i = 0; i < positions.length; i += 3) {
            const factor = 0.7 + Math.random() * 0.6;
            positions[i] *= factor;
            positions[i + 1] *= factor;
            positions[i + 2] *= factor;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    /**
     * 글로우 이펙트 생성 (아이템용)
     */
    createGlowEffect(color) {
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        this.glowEffect = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowEffect.scale.setScalar(this.size);
    }
    
    /**
     * 소행성 업데이트
     */
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // 위치 업데이트
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // 회전 업데이트
        this.mesh.rotation.x += this.rotationSpeed.x * deltaTime;
        this.mesh.rotation.y += this.rotationSpeed.y * deltaTime;
        this.mesh.rotation.z += this.rotationSpeed.z * deltaTime;
        
        // 메시 위치 업데이트
        this.mesh.position.copy(this.position);
        
        // 글로우 이펙트 업데이트
        if (this.glowEffect) {
            this.glowEffect.position.copy(this.position);
            
            // 펄스 효과
            const time = performance.now() * 0.001;
            const pulse = 1.0 + 0.3 * Math.sin(time * 3);
            this.glowEffect.scale.setScalar(this.size * pulse);
            
            // 투명도 변화
            const opacity = 0.1 + 0.2 * (0.5 + 0.5 * Math.sin(time * 2));
            this.glowEffect.material.opacity = opacity;
        }
        
        // 경계 구 업데이트
        this.boundingSphere.center.copy(this.position);
        this.boundingSphere.radius = this.size;
        
        // 게임 영역을 벗어나면 제거
        if (this.position.length() > 300) {
            this.destroy();
        }
    }
    
    /**
     * 우주선과의 충돌 체크
     */
    checkCollision(spaceship) {
        if (this.isDestroyed || spaceship.isDestroyed) return false;
        
        const spaceshipSphere = spaceship.getBoundingSphere();
        return this.boundingSphere.intersectsSphere(spaceshipSphere);
    }
    
    /**
     * 소행성 파괴
     */
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // 파괴 이펙트 생성
        this.createDestroyEffect();
        
        // 메시 제거
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        if (this.glowEffect) {
            this.scene.remove(this.glowEffect);
        }
    }
    
    /**
     * 파괴 이펙트 생성
     */
    createDestroyEffect() {
        if (this.type === 'obstacle') {
            // 폭발 파티클
            this.createExplosionParticles();
        } else {
            // 수집 이펙트
            this.createCollectionEffect();
        }
    }
    
    /**
     * 폭발 파티클 생성
     */
    createExplosionParticles() {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = this.position.x;
            positions[i3 + 1] = this.position.y;
            positions[i3 + 2] = this.position.z;
            
            const speed = 5 + Math.random() * 10;
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            velocities[i3] = direction.x * speed;
            velocities[i3 + 1] = direction.y * speed;
            velocities[i3 + 2] = direction.z * speed;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffaa44,
            size: 0.5,
            transparent: true,
            opacity: 1.0
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // 파티클 애니메이션
        let life = 1.0;
        const animate = () => {
            if (life > 0) {
                life -= 0.02;
                material.opacity = life;
                
                const pos = geometry.attributes.position.array;
                for (let i = 0; i < pos.length; i += 3) {
                    pos[i] += velocities[i] * 0.016;
                    pos[i + 1] += velocities[i + 1] * 0.016;
                    pos[i + 2] += velocities[i + 2] * 0.016;
                }
                geometry.attributes.position.needsUpdate = true;
                
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particles);
            }
        };
        animate();
    }
    
    /**
     * 수집 이펙트 생성
     */
    createCollectionEffect() {
        const ringCount = 5;
        const rings = [];
        
        for (let i = 0; i < ringCount; i++) {
            const geometry = new THREE.RingGeometry(0.5, 1, 16);
            const material = new THREE.MeshBasicMaterial({
                color: this.getEffectColor(),
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(geometry, material);
            ring.position.copy(this.position);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            ring.rotation.z = Math.random() * Math.PI;
            
            this.scene.add(ring);
            rings.push(ring);
        }
        
        // 링 애니메이션
        let scale = 0.1;
        let opacity = 0.8;
        const animate = () => {
            if (scale < 3) {
                scale += 0.1;
                opacity -= 0.02;
                
                rings.forEach((ring, index) => {
                    ring.scale.setScalar(scale + index * 0.2);
                    ring.material.opacity = Math.max(0, opacity - index * 0.1);
                    ring.rotation.x += 0.05;
                    ring.rotation.y += 0.03;
                });
                
                requestAnimationFrame(animate);
            } else {
                rings.forEach(ring => this.scene.remove(ring));
            }
        };
        animate();
    }
    
    /**
     * 타입별 이펙트 색상 반환
     */
    getEffectColor() {
        switch (this.type) {
            case 'fuel': return 0x00ff88;
            case 'health': return 0xff4488;
            case 'bonus': return 0xffaa00;
            default: return 0xffffff;
        }
    }
    
    /**
     * 소행성 정리
     */
    dispose() {
        this.destroy();
    }
}

/**
 * 소행성 관리자 클래스
 * 소행성 생성, 관리, 충돌 체크 등을 담당
 */
class AsteroidManager {
    constructor(scene) {
        this.scene = scene;
        this.asteroids = [];
        this.spawnRate = 2.0; // 초당 생성 수
        this.spawnTimer = 0;
        this.spawnDistance = 100;
        this.difficulty = 1;
        
        // 타입별 생성 확률
        this.spawnProbability = {
            obstacle: 0.7,
            fuel: 0.1,
            health: 0.1,
            bonus: 0.1
        };
    }
    
    /**
     * 소행성 매니저 업데이트
     */
    update(deltaTime, spaceshipPosition) {
        // 기존 소행성들 업데이트
        this.asteroids.forEach(asteroid => {
            asteroid.update(deltaTime);
        });
        
        // 파괴된 소행성 제거
        this.asteroids = this.asteroids.filter(asteroid => !asteroid.isDestroyed);
        
        // 새 소행성 생성
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= 1.0 / this.spawnRate) {
            this.spawnAsteroid(spaceshipPosition);
            this.spawnTimer = 0;
        }
        
        // 난이도 증가
        this.difficulty += deltaTime * 0.01;
        this.spawnRate = Math.min(5.0, 2.0 + this.difficulty * 0.5);
    }
    
    /**
     * 새 소행성 생성
     */
    spawnAsteroid(spaceshipPosition) {
        // 우주선 주변에 생성
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
        
        const position = new THREE.Vector3(
            spaceshipPosition.x + Math.cos(angle) * Math.cos(elevation) * this.spawnDistance,
            spaceshipPosition.y + Math.sin(elevation) * this.spawnDistance,
            spaceshipPosition.z + Math.sin(angle) * Math.cos(elevation) * this.spawnDistance
        );
        
        // 타입 결정
        const rand = Math.random();
        let type = 'obstacle';
        let cumulative = 0;
        
        for (const [asteroidType, probability] of Object.entries(this.spawnProbability)) {
            cumulative += probability;
            if (rand <= cumulative) {
                type = asteroidType;
                break;
            }
        }
        
        // 크기 결정
        const size = 0.8 + Math.random() * 1.4;
        
        // 소행성 생성
        const asteroid = new Asteroid(this.scene, position, size, type);
        
        // 우주선 쪽으로 향하는 속도 추가
        const direction = spaceshipPosition.clone().sub(position).normalize();
        asteroid.velocity.add(direction.multiplyScalar(2 + Math.random() * 3));
        
        this.asteroids.push(asteroid);
        
        // 글로우 이펙트가 있으면 장면에 추가
        if (asteroid.glowEffect) {
            this.scene.add(asteroid.glowEffect);
        }
    }
    
    /**
     * 우주선과의 충돌 체크
     */
    checkCollisions(spaceship) {
        const collisions = [];
        
        this.asteroids.forEach((asteroid, index) => {
            if (asteroid.checkCollision(spaceship)) {
                collisions.push({
                    asteroid: asteroid,
                    index: index,
                    type: asteroid.type
                });
            }
        });
        
        return collisions;
    }
    
    /**
     * 특정 소행성 제거
     */
    removeAsteroid(index) {
        if (index >= 0 && index < this.asteroids.length) {
            this.asteroids[index].destroy();
            this.asteroids.splice(index, 1);
        }
    }
    
    /**
     * 모든 소행성 제거
     */
    clearAll() {
        this.asteroids.forEach(asteroid => asteroid.destroy());
        this.asteroids = [];
    }
    
    /**
     * 난이도 설정
     */
    setDifficulty(level) {
        this.difficulty = level;
        this.spawnRate = Math.min(5.0, 2.0 + level * 0.5);
        
        // 장애물 비율 증가
        const obstacleProbability = Math.min(0.9, 0.7 + level * 0.05);
        const itemProbability = (1.0 - obstacleProbability) / 3;
        
        this.spawnProbability = {
            obstacle: obstacleProbability,
            fuel: itemProbability,
            health: itemProbability,
            bonus: itemProbability
        };
    }
    
    /**
     * 현재 소행성 수 반환
     */
    getAsteroidCount() {
        return this.asteroids.length;
    }
    
    /**
     * 메모리 정리
     */
    dispose() {
        this.clearAll();
    }
}