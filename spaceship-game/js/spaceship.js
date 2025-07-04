/**
 * 3D 우주선 클래스
 * 센서 입력에 따른 우주선 조종 및 물리 시뮬레이션
 */
class Spaceship {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.engineParticles = [];
        this.thrusterParticles = [];
        
        // 물리 속성
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        this.quaternion = new THREE.Quaternion();
        
        // 우주선 속성 (반응성 향상)
        this.maxSpeed = 50;
        this.thrustPower = 40;        // 25 → 40 (추진력 증가)
        this.maneuverPower = 25;      // 15 → 25 (조종력 증가)
        this.rotationSpeed = 4;       // 2 → 4 (회전 속도 증가)
        this.drag = 0.98;
        this.angularDrag = 0.92;      // 0.95 → 0.92 (각속도 감쇠 감소로 더 반응적)
        
        // 연료 시스템
        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelConsumption = 0.5;
        
        // 생명력
        this.health = 100;
        this.maxHealth = 100;
        this.isDestroyed = false;
        
        // 이펙트
        this.engineFlame = null;
        this.thrusterFlames = [];
        this.shieldEffect = null;
        
        // 경계 상자 (충돌 감지용)
        this.boundingBox = new THREE.Box3();
        this.boundingSphere = new THREE.Sphere();
        
        this.createSpaceship();
        this.createEngineEffects();
        this.createThrusterEffects();
    }
    
    /**
     * 우주선 3D 모델 생성
     */
    createSpaceship() {
        const group = new THREE.Group();
        
        // 메인 선체
        const hullGeometry = new THREE.ConeGeometry(1, 6, 8);
        const hullMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            shininess: 100,
            specular: 0x444444
        });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.rotation.x = Math.PI / 2;
        hull.castShadow = true;
        hull.receiveShadow = true;
        group.add(hull);
        
        // 콕핏
        const cockpitGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.7,
            shininess: 100
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.z = 2;
        cockpit.scale.z = 0.6;
        cockpit.castShadow = true;
        group.add(cockpit);
        
        // 날개들
        this.createWings(group);
        
        // 엔진 노즐들
        this.createEngineNozzles(group);
        
        // 무기 마운트
        this.createWeaponMounts(group);
        
        // 디테일 추가
        this.addDetails(group);
        
        this.mesh = group;
        this.scene.add(this.mesh);
        
        // 초기 위치 설정
        this.mesh.position.copy(this.position);
    }
    
    /**
     * 우주선 날개 생성
     */
    createWings(group) {
        const wingGeometry = new THREE.BoxGeometry(4, 0.2, 2);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 80
        });
        
        // 좌측 날개
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1.5, 0, -0.5);
        leftWing.rotation.z = 0.1;
        leftWing.castShadow = true;
        group.add(leftWing);
        
        // 우측 날개
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1.5, 0, -0.5);
        rightWing.rotation.z = -0.1;
        rightWing.castShadow = true;
        group.add(rightWing);
        
        // 날개 끝 라이트
        this.createWingLights(group);
    }
    
    /**
     * 날개 끝 라이트 생성
     */
    createWingLights(group) {
        const lightGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        
        // 좌측 라이트 (빨간색)
        const leftLightMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444 // 밝은 빨간색
        });
        const leftLight = new THREE.Mesh(lightGeometry, leftLightMaterial);
        leftLight.position.set(-3.5, 0, -0.5);
        group.add(leftLight);
        
        // 우측 라이트 (초록색)
        const rightLightMaterial = new THREE.MeshBasicMaterial({
            color: 0x44ff44 // 밝은 초록색
        });
        const rightLight = new THREE.Mesh(lightGeometry, rightLightMaterial);
        rightLight.position.set(3.5, 0, -0.5);
        group.add(rightLight);
        
        this.wingLights = [leftLight, rightLight];
    }
    
    /**
     * 엔진 노즐 생성
     */
    createEngineNozzles(group) {
        const nozzleGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 8);
        const nozzleMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 120
        });
        
        // 메인 엔진 노즐
        const mainNozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        mainNozzle.position.z = -3.5;
        mainNozzle.rotation.x = Math.PI / 2;
        mainNozzle.castShadow = true;
        group.add(mainNozzle);
        
        // 측면 스러스터 노즐들
        const smallNozzleGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.8, 6);
        
        const positions = [
            [-1.2, 0.3, -1],   // 좌상
            [1.2, 0.3, -1],    // 우상
            [-1.2, -0.3, -1],  // 좌하
            [1.2, -0.3, -1]    // 우하
        ];
        
        this.thrusterNozzles = [];
        positions.forEach((pos, index) => {
            const nozzle = new THREE.Mesh(smallNozzleGeometry, nozzleMaterial);
            nozzle.position.set(pos[0], pos[1], pos[2]);
            nozzle.rotation.x = Math.PI / 2;
            nozzle.castShadow = true;
            group.add(nozzle);
            this.thrusterNozzles.push(nozzle);
        });
        
        this.mainNozzle = mainNozzle;
    }
    
    /**
     * 무기 마운트 생성
     */
    createWeaponMounts(group) {
        const weaponGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
        const weaponMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            shininess: 100
        });
        
        // 좌측 무기
        const leftWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        leftWeapon.position.set(-0.8, 0, 1.5);
        leftWeapon.rotation.x = Math.PI / 2;
        leftWeapon.castShadow = true;
        group.add(leftWeapon);
        
        // 우측 무기
        const rightWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        rightWeapon.position.set(0.8, 0, 1.5);
        rightWeapon.rotation.x = Math.PI / 2;
        rightWeapon.castShadow = true;
        group.add(rightWeapon);
        
        this.weapons = [leftWeapon, rightWeapon];
    }
    
    /**
     * 디테일 추가
     */
    addDetails(group) {
        // 안테나
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 6);
        const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, 0.5, 1);
        group.add(antenna);
        
        // 센서 어레이
        const sensorGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
        const sensorMaterial = new THREE.MeshPhongMaterial({
            color: 0x0066ff,
            emissive: 0x002244,
            emissiveIntensity: 0.3
        });
        
        const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
        sensor.position.set(0, 0, 2.5);
        group.add(sensor);
        
        this.sensor = sensor;
    }
    
    /**
     * 엔진 이펙트 생성
     */
    createEngineEffects() {
        // 메인 엔진 플레임
        const flameGeometry = new THREE.ConeGeometry(0.4, 2, 8);
        const flameMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;
                varying float vIntensity;
                
                void main() {
                    vUv = uv;
                    vIntensity = intensity;
                    
                    vec3 pos = position;
                    pos.x += sin(time * 10.0 + pos.y * 5.0) * 0.1 * intensity;
                    pos.y += sin(time * 8.0 + pos.x * 3.0) * 0.1 * intensity;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying float vIntensity;
                
                void main() {
                    float noise = sin(vUv.y * 10.0 + time * 20.0) * 0.5 + 0.5;
                    vec3 color = mix(vec3(0.0, 0.4, 1.0), vec3(1.0, 0.6, 0.0), vUv.y);
                    color = mix(color, vec3(1.0, 1.0, 1.0), noise * 0.3);
                    
                    float alpha = (1.0 - vUv.y) * vIntensity * (0.7 + noise * 0.3);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        this.engineFlame = new THREE.Mesh(flameGeometry, flameMaterial);
        this.engineFlame.position.z = -4.5;
        this.engineFlame.rotation.x = Math.PI;
        this.engineFlame.visible = false;
        this.mesh.add(this.engineFlame);
    }
    
    /**
     * 스러스터 이펙트 생성
     */
    createThrusterEffects() {
        const thrusterPositions = [
            [-1.2, 0.3, -1.8],   // 좌상
            [1.2, 0.3, -1.8],    // 우상
            [-1.2, -0.3, -1.8],  // 좌하
            [1.2, -0.3, -1.8]    // 우하
        ];
        
        thrusterPositions.forEach((pos, index) => {
            const flameGeometry = new THREE.ConeGeometry(0.2, 1, 6);
            const flameMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.8
            });
            
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.set(pos[0], pos[1], pos[2]);
            flame.rotation.x = Math.PI;
            flame.visible = false;
            this.mesh.add(flame);
            
            this.thrusterFlames.push(flame);
        });
    }
    
    /**
     * 센서 입력에 따른 우주선 업데이트
     */
    update(deltaTime, gameInput) {
        if (this.isDestroyed) return;
        
        // 연료 체크 (센서 데이터 유효성 검사 추가)
        if (!gameInput || typeof gameInput !== 'object') {
            return; // 잘못된 게임 입력
        }
        
        // 게임 입력 값 검증 및 필터링
        const safeThrust = this.filterValue(gameInput.thrust) || 0;
        const safeSideThrust = this.filterValue(gameInput.sideThrust) || 0;
        const safeUpThrust = this.filterValue(gameInput.upThrust) || 0;
        
        const thrustUsed = Math.abs(safeThrust) + 
                          Math.abs(safeSideThrust) + 
                          Math.abs(safeUpThrust);
        
        if (thrustUsed > 0 && this.fuel > 0) {
            // 연료 소모율을 크게 감소 (원래 1/10로)
            this.fuel -= this.fuelConsumption * thrustUsed * deltaTime * 6; // 60 → 6
            this.fuel = Math.max(0, this.fuel);
        }
        
        // 물리 업데이트
        this.updatePhysics(deltaTime, gameInput);
        
        // 시각적 효과 업데이트
        this.updateEffects(deltaTime, gameInput);
        
        // 3D 메시 위치/회전 업데이트
        this.updateMesh();
        
        // 경계 상자 업데이트
        this.updateBoundingBox();
    }
    
    /**
     * 물리 시뮬레이션 업데이트
     */
    updatePhysics(deltaTime, gameInput) {
        // 각속도 업데이트 (자이로스코프 입력)
        if (this.fuel > 0) {
            this.angularVelocity.x += gameInput.pitch * this.rotationSpeed * deltaTime;
            this.angularVelocity.y += gameInput.yaw * this.rotationSpeed * deltaTime;
            this.angularVelocity.z += gameInput.roll * this.rotationSpeed * deltaTime;
        }
        
        // 각속도 감쇠
        this.angularVelocity.multiplyScalar(this.angularDrag);
        
        // 회전 적용
        this.rotation.x += this.angularVelocity.x * deltaTime;
        this.rotation.y += this.angularVelocity.y * deltaTime;
        this.rotation.z += this.angularVelocity.z * deltaTime;
        
        // 쿼터니언 업데이트
        this.quaternion.setFromEuler(this.rotation);
        
        // 추진력 계산 (가속도계 입력)
        if (this.fuel > 0) {
            const localAcceleration = new THREE.Vector3(
                gameInput.sideThrust * this.maneuverPower,
                gameInput.upThrust * this.maneuverPower,
                gameInput.thrust * this.thrustPower
            );
            
            // 우주선 방향으로 추진력 변환
            const worldAcceleration = localAcceleration.clone();
            worldAcceleration.applyQuaternion(this.quaternion);
            
            this.acceleration.copy(worldAcceleration);
        } else {
            this.acceleration.set(0, 0, 0);
        }
        
        // 속도 업데이트
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // 속도 제한
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        // 공간 저항
        this.velocity.multiplyScalar(this.drag);
        
        // 위치 업데이트
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // 경계 확인 (게임 영역 제한)
        const boundary = 200;
        if (Math.abs(this.position.x) > boundary) {
            this.position.x = Math.sign(this.position.x) * boundary;
            this.velocity.x *= -0.5;
        }
        if (Math.abs(this.position.y) > boundary) {
            this.position.y = Math.sign(this.position.y) * boundary;
            this.velocity.y *= -0.5;
        }
        if (Math.abs(this.position.z) > boundary) {
            this.position.z = Math.sign(this.position.z) * boundary;
            this.velocity.z *= -0.5;
        }
    }
    
    /**
     * 시각적 효과 업데이트
     */
    updateEffects(deltaTime, gameInput) {
        const time = performance.now() * 0.001;
        
        // 메인 엔진 이펙트
        const thrustIntensity = Math.abs(gameInput.thrust);
        if (thrustIntensity > 0.1 && this.fuel > 0) {
            this.engineFlame.visible = true;
            this.engineFlame.material.uniforms.time.value = time;
            this.engineFlame.material.uniforms.intensity.value = thrustIntensity;
            this.engineFlame.scale.setScalar(0.5 + thrustIntensity * 0.5);
        } else {
            this.engineFlame.visible = false;
        }
        
        // 스러스터 이펙트
        const thrusterInputs = [
            gameInput.sideThrust < -0.1 ? -gameInput.sideThrust : 0, // 좌상 (우측으로 이동)
            gameInput.sideThrust > 0.1 ? gameInput.sideThrust : 0,   // 우상 (좌측으로 이동)
            gameInput.upThrust < -0.1 ? -gameInput.upThrust : 0,     // 좌하 (위로 이동)
            gameInput.upThrust > 0.1 ? gameInput.upThrust : 0        // 우하 (아래로 이동)
        ];
        
        this.thrusterFlames.forEach((flame, index) => {
            const intensity = thrusterInputs[index];
            if (intensity > 0 && this.fuel > 0) {
                flame.visible = true;
                flame.scale.setScalar(0.3 + intensity * 0.7);
                flame.material.opacity = 0.6 + intensity * 0.4;
            } else {
                flame.visible = false;
            }
        });
        
        // 날개 라이트 깜빡임
        if (this.wingLights) {
            const blinkSpeed = 2;
            const blinkIntensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * blinkSpeed));
            this.wingLights.forEach(light => {
                light.material.emissiveIntensity = blinkIntensity;
            });
        }
        
        // 센서 펄스
        if (this.sensor) {
            const pulseIntensity = 0.1 + 0.2 * (0.5 + 0.5 * Math.sin(time * 3));
            this.sensor.material.emissiveIntensity = pulseIntensity;
        }
    }
    
    /**
     * 3D 메시 위치/회전 업데이트
     */
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.quaternion.copy(this.quaternion);
        }
    }
    
    /**
     * 경계 상자 업데이트
     */
    updateBoundingBox() {
        if (this.mesh) {
            this.boundingBox.setFromObject(this.mesh);
            this.boundingSphere.setFromPoints([
                this.position.clone().add(new THREE.Vector3(-2, -1, -3)),
                this.position.clone().add(new THREE.Vector3(2, 1, 3))
            ]);
        }
    }
    
    /**
     * 데미지 받기
     */
    takeDamage(damage) {
        if (this.isDestroyed) return false;
        
        this.health -= damage;
        
        if (this.health <= 0) {
            this.health = 0;
            this.destroy();
            return true;
        }
        
        // 데미지 이펙트
        this.showDamageEffect();
        return false;
    }
    
    /**
     * 데미지 이펙트 표시
     */
    showDamageEffect() {
        // 잠시 붉은색으로 깜빡임
        const originalColor = this.mesh.children[0].material.color.clone();
        this.mesh.children[0].material.color.setHex(0xff4444);
        
        setTimeout(() => {
            if (this.mesh && this.mesh.children[0]) {
                this.mesh.children[0].material.color.copy(originalColor);
            }
        }, 200);
    }
    
    /**
     * 우주선 파괴
     */
    destroy() {
        this.isDestroyed = true;
        this.health = 0;
        
        // 파괴 이펙트 생성
        this.createExplosionEffect();
        
        // 메시 숨기기 (잠시 후)
        setTimeout(() => {
            if (this.mesh) {
                this.mesh.visible = false;
            }
        }, 1000);
    }
    
    /**
     * 폭발 이펙트 생성
     */
    createExplosionEffect() {
        // 파티클 폭발 효과
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = this.position.x + (Math.random() - 0.5) * 2;
            positions[i3 + 1] = this.position.y + (Math.random() - 0.5) * 2;
            positions[i3 + 2] = this.position.z + (Math.random() - 0.5) * 2;
            
            velocities[i3] = (Math.random() - 0.5) * 20;
            velocities[i3 + 1] = (Math.random() - 0.5) * 20;
            velocities[i3 + 2] = (Math.random() - 0.5) * 20;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff4400,
            size: 0.5,
            transparent: true,
            opacity: 1.0
        });
        
        const explosion = new THREE.Points(particles, particleMaterial);
        this.scene.add(explosion);
        
        // 파티클 애니메이션
        let opacity = 1.0;
        const animateExplosion = () => {
            if (opacity > 0) {
                opacity -= 0.02;
                particleMaterial.opacity = opacity;
                
                const pos = particles.attributes.position.array;
                for (let i = 0; i < pos.length; i += 3) {
                    pos[i] += velocities[i] * 0.016;
                    pos[i + 1] += velocities[i + 1] * 0.016;
                    pos[i + 2] += velocities[i + 2] * 0.016;
                }
                particles.attributes.position.needsUpdate = true;
                
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        animateExplosion();
    }
    
    /**
     * 연료 보충
     */
    refuel(amount) {
        this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    }
    
    /**
     * 체력 회복
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    /**
     * 우주선 리셋 (게임 재시작용)
     */
    reset() {
        this.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.quaternion.set(0, 0, 0, 1);
        
        this.fuel = this.maxFuel;
        this.health = this.maxHealth;
        this.isDestroyed = false;
        
        if (this.mesh) {
            this.mesh.visible = true;
            this.updateMesh();
        }
    }
    
    /**
     * 현재 위치 반환
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * 현재 회전 반환
     */
    getRotation() {
        return this.quaternion.clone();
    }
    
    /**
     * 경계 구 반환
     */
    getBoundingSphere() {
        return this.boundingSphere;
    }
    
    /**
     * 연료 비율 반환 (0-1)
     */
    getFuelRatio() {
        return this.fuel / this.maxFuel;
    }
    
    /**
     * 체력 비율 반환 (0-1)
     */
    getHealthRatio() {
        return this.health / this.maxHealth;
    }
    
    /**
     * 값 필터링 (센서 데이터 안정화)
     */
    filterValue(value) {
        if (!isFinite(value) || isNaN(value)) {
            return 0;
        }
        // 극단적인 값 제한
        return Math.max(-1, Math.min(1, value));
    }
    
    /**
     * 우주선 정리
     */
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            
            // 메모리 정리
            this.mesh.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
    }
}