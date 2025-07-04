/**
 * Three.js 기반 3D 게임 엔진
 * 장면, 렌더러, 카메라, 조명 등을 관리
 */
class GameEngine {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // 카메라 설정
        this.cameraOffset = new THREE.Vector3(0, 5, 10);
        this.cameraLookOffset = new THREE.Vector3(0, 0, -20);
        this.cameraSpeed = 0.05;
        
        // 환경 설정
        this.ambientLight = null;
        this.directionalLight = null;
        this.pointLights = [];
        
        // 파티클 시스템
        this.particleSystems = [];
        
        // 성능 모니터링
        this.frameCount = 0;
        this.lastFPSCheck = 0;
        this.currentFPS = 60;
        
        this.init();
    }
    
    /**
     * 게임 엔진 초기화
     */
    init() {
        console.log('🎮 게임 엔진 초기화 시작...');
        console.log('Three.js 버전:', THREE.REVISION);
        console.log('컨테이너 요소:', this.container);
        
        try {
            this.createScene();
            console.log('✓ 3D 장면 생성 완료');
            
            this.createCamera();
            console.log('✓ 카메라 생성 완료');
            
            this.createRenderer();
            console.log('✓ 렌더러 생성 완료');
            
            this.createLights();
            console.log('✓ 조명 설정 완료');
            
            this.createEnvironment();
            console.log('✓ 환경 생성 완료');
            
            this.setupEventListeners();
            console.log('✓ 이벤트 리스너 설정 완료');
            
            // 테스트 큐브 추가
            this.addTestCube();
            console.log('✓ 테스트 오브젝트 추가 완료');
            
            // 즉시 테스트 렌더링
            this.testRender();
            
            console.log('🎮 게임 엔진 초기화 완료!');
        } catch (error) {
            console.error('❌ 게임 엔진 초기화 실패:', error);
            throw error;
        }
    }
    
    /**
     * 3D 장면 생성
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000011, 50, 300);
        
        // 우주 배경 설정
        this.createSpaceBackground();
    }
    
    /**
     * 카메라 생성
     */
    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 5); // 테스트 큐브를 더 잘 보기 위해 가까이 이동
        console.log('카메라 위치 설정:', this.camera.position);
    }
    
    /**
     * 렌더러 생성
     */
    createRenderer() {
        try {
            // WebGL 지원 확인
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                throw new Error('WebGL이 지원되지 않습니다.');
            }
            console.log('✅ WebGL 지원 확인됨');
            
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
            });
            
            console.log('✅ WebGL 렌더러 생성됨');
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x220022, 1.0); // 보라색으로 변경하여 렌더링 확인
            
            // 그림자 설정
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // 톤 매핑 설정
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;
            
            console.log('✅ 렌더러 설정 완료');
            console.log('렌더러 크기:', window.innerWidth, 'x', window.innerHeight);
            
            // 렌더러 DOM 요소에 스타일 추가
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.zIndex = '1';
            this.renderer.domElement.style.display = 'block';
            
            console.log('컨테이너 요소:', this.container);
            console.log('컨테이너 스타일:', this.container.style.cssText);
            
            this.container.appendChild(this.renderer.domElement);
            console.log('✅ 렌더러 DOM 요소 추가됨');
            console.log('캔버스 요소:', this.renderer.domElement);
            console.log('캔버스가 컨테이너에 추가되었나?', this.container.contains(this.renderer.domElement));
            
        } catch (error) {
            console.error('❌ WebGL 렌더러 생성 실패:', error);
            
            // WebGL이 지원되지 않는 경우 대체 처리
            alert('WebGL이 지원되지 않는 브라우저입니다. 최신 브라우저를 사용해주세요.');
            throw error;
        }
    }
    
    /**
     * 조명 설정
     */
    createLights() {
        // 환경광
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(this.ambientLight);
        
        // 주 방향광 (태양)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionalLight.position.set(100, 100, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.scene.add(this.directionalLight);
        
        // 보조 조명들
        this.createAccentLights();
    }
    
    /**
     * 보조 조명 생성
     */
    createAccentLights() {
        // 파란색 포인트 라이트
        const blueLight = new THREE.PointLight(0x0066ff, 0.5, 100);
        blueLight.position.set(-50, 30, -30);
        this.scene.add(blueLight);
        this.pointLights.push(blueLight);
        
        // 주황색 포인트 라이트
        const orangeLight = new THREE.PointLight(0xff3300, 0.4, 80);
        orangeLight.position.set(40, -20, 40);
        this.scene.add(orangeLight);
        this.pointLights.push(orangeLight);
    }
    
    /**
     * 우주 배경 생성
     */
    createSpaceBackground() {
        // 별 필드 생성
        this.createStarField();
        
        // 네뷸라 효과
        this.createNebula();
        
        // 원거리 행성들
        this.createDistantPlanets();
    }
    
    /**
     * 별 필드 생성
     */
    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // 구면 좌표계로 별 위치 생성
            const radius = 400 + Math.random() * 200;
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(theta);
            
            // NaN 방지 처리
            positions[i3] = isNaN(x) ? 0 : x;
            positions[i3 + 1] = isNaN(y) ? 0 : y;
            positions[i3 + 2] = isNaN(z) ? 0 : z;
            
            // 별 색상 (다양한 색온도)
            const temperature = Math.random();
            if (temperature < 0.3) {
                // 차가운 별 (파란색)
                colors[i3] = 0.6 + Math.random() * 0.4;
                colors[i3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i3 + 2] = 1.0;
            } else if (temperature < 0.7) {
                // 중간 온도 별 (흰색)
                colors[i3] = 0.9 + Math.random() * 0.1;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 0.9 + Math.random() * 0.1;
            } else {
                // 뜨거운 별 (주황색/빨간색)
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.6 + Math.random() * 0.4;
                colors[i3 + 2] = 0.3 + Math.random() * 0.3;
            }
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
    
    /**
     * 네뷸라 효과 생성
     */
    createNebula() {
        const nebulaGeometry = new THREE.BufferGeometry();
        const nebulaCount = 500;
        const positions = new Float32Array(nebulaCount * 3);
        const colors = new Float32Array(nebulaCount * 3);
        const sizes = new Float32Array(nebulaCount);
        
        for (let i = 0; i < nebulaCount; i++) {
            const i3 = i * 3;
            
            // 네뷸라 클러스터 위치
            const clusterX = (Math.random() - 0.5) * 600;
            const clusterY = (Math.random() - 0.5) * 200;
            const clusterZ = (Math.random() - 0.5) * 600;
            
            const x = clusterX + (Math.random() - 0.5) * 100;
            const y = clusterY + (Math.random() - 0.5) * 50;
            const z = clusterZ + (Math.random() - 0.5) * 100;
            
            // NaN 방지 처리
            positions[i3] = isNaN(x) ? 0 : x;
            positions[i3 + 1] = isNaN(y) ? 0 : y;
            positions[i3 + 2] = isNaN(z) ? 0 : z;
            
            // 네뷸라 색상 (주로 자주색과 파란색)
            colors[i3] = 0.3 + Math.random() * 0.5;     // R
            colors[i3 + 1] = 0.1 + Math.random() * 0.3; // G
            colors[i3 + 2] = 0.8 + Math.random() * 0.2; // B
            
            sizes[i] = 5 + Math.random() * 15;
        }
        
        nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    float pulseFactor = 1.0 + 0.3 * sin(time * 2.0 + position.x * 0.01);
                    gl_PointSize = size * pulseFactor * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.1, 0.5, r);
                    gl_FragColor = vec4(vColor, alpha * 0.3);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        this.scene.add(nebula);
        this.nebula = nebula;
    }
    
    /**
     * 원거리 행성들 생성
     */
    createDistantPlanets() {
        const planets = [];
        
        for (let i = 0; i < 3; i++) {
            const radius = 8 + Math.random() * 12;
            const geometry = new THREE.SphereGeometry(radius, 32, 32);
            
            // 행성 텍스처 (절차적 생성)
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            // 그라디언트 배경
            const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            const colors = [
                ['#ff6b35', '#f7931e'],
                ['#4ecdc4', '#44a08d'],
                ['#f093fb', '#f5576c']
            ];
            const colorPair = colors[i % colors.length];
            gradient.addColorStop(0, colorPair[0]);
            gradient.addColorStop(1, colorPair[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
            
            // 노이즈 패턴 추가
            for (let y = 0; y < 256; y += 4) {
                for (let x = 0; x < 256; x += 4) {
                    if (Math.random() > 0.7) {
                        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
                        ctx.fillRect(x, y, 4, 4);
                    }
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshPhongMaterial({ 
                map: texture,
                shininess: 30
            });
            
            const planet = new THREE.Mesh(geometry, material);
            
            // 행성 위치 (멀리 배치)
            const angle = (i / 3) * Math.PI * 2;
            const distance = 250 + Math.random() * 150;
            planet.position.set(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 100,
                Math.sin(angle) * distance
            );
            
            planet.rotation.x = Math.random() * Math.PI;
            planet.rotation.y = Math.random() * Math.PI;
            
            this.scene.add(planet);
            planets.push(planet);
        }
        
        this.distantPlanets = planets;
    }
    
    /**
     * 환경 효과 생성
     */
    createEnvironment() {
        // 우주 먼지 파티클
        this.createSpaceDust();
    }
    
    /**
     * 우주 먼지 파티클 생성
     */
    createSpaceDust() {
        const dustGeometry = new THREE.BufferGeometry();
        const dustCount = 1000;
        const positions = new Float32Array(dustCount * 3);
        const velocities = new Float32Array(dustCount * 3);
        
        for (let i = 0; i < dustCount; i++) {
            const i3 = i * 3;
            
            // 유효한 값으로 초기화 (NaN 방지)
            let x = (Math.random() - 0.5) * 200;
            let y = (Math.random() - 0.5) * 100;
            let z = (Math.random() - 0.5) * 200;
            let vx = (Math.random() - 0.5) * 0.1;
            let vy = (Math.random() - 0.5) * 0.1;
            let vz = (Math.random() - 0.5) * 0.1;
            
            // NaN 검사 및 기본값 설정
            positions[i3] = isNaN(x) ? 0 : x;
            positions[i3 + 1] = isNaN(y) ? 0 : y;
            positions[i3 + 2] = isNaN(z) ? 0 : z;
            
            velocities[i3] = isNaN(vx) ? 0.01 : vx;
            velocities[i3 + 1] = isNaN(vy) ? 0.01 : vy;
            velocities[i3 + 2] = isNaN(vz) ? 0.01 : vz;
        }
        
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        dustGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const dustMaterial = new THREE.PointsMaterial({
            color: 0x666666,
            size: 0.5,
            transparent: true,
            opacity: 0.4
        });
        
        const dust = new THREE.Points(dustGeometry, dustMaterial);
        this.scene.add(dust);
        this.spaceDust = dust;
        
        console.log('✅ 우주 먼지 파티클 생성 완료 (NaN 방지 처리됨)');
    }
    
    /**
     * 테스트 큐브 추가 (렌더링 확인용)
     */
    addTestCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            emissive: 0x002200,
            emissiveIntensity: 0.2
        });
        
        this.testCube = new THREE.Mesh(geometry, material);
        this.testCube.position.set(0, 0, -5); // 카메라에 더 가까이 배치
        this.testCube.castShadow = true;
        this.testCube.receiveShadow = true;
        
        this.scene.add(this.testCube);
        console.log('✅ 테스트 큐브 추가됨 - 위치:', this.testCube.position);
        
        // 카메라가 테스트 큐브를 바라보도록 설정
        this.camera.lookAt(this.testCube.position);
        console.log('✅ 카메라가 테스트 큐브를 바라보도록 설정됨');
        
        // 장면 전체 상태 확인
        console.log('✅ 장면 현재 상태:');
        console.log('  - 총 객체 수:', this.scene.children.length);
        console.log('  - 카메라 위치:', this.camera.position);
        console.log('  - 렌더러 크기:', this.renderer.getSize(new THREE.Vector2()));
    }
    
    /**
     * 테스트 렌더링 (초기화 직후 확인용)
     */
    testRender() {
        console.log('🧪 테스트 렌더링 시작...');
        
        try {
            // 렌더러가 제대로 DOM에 추가되었는지 확인
            console.log('캔버스 DOM 요소:', this.renderer.domElement);
            console.log('캔버스 크기:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);
            console.log('캔버스 스타일:', this.renderer.domElement.style.cssText);
            
            // 컨테이너에 제대로 추가되었는지 확인
            console.log('컨테이너 자식 요소들:', this.container.children);
            
            // 렌더링 시도
            this.renderer.render(this.scene, this.camera);
            console.log('✅ 테스트 렌더링 완료');
            
            // 캔버스 픽셀 데이터 확인 (검은색만 있는지 확인)
            const gl = this.renderer.getContext();
            const pixels = new Uint8Array(4);
            gl.readPixels(
                Math.floor(this.renderer.domElement.width / 2), 
                Math.floor(this.renderer.domElement.height / 2), 
                1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels
            );
            console.log('중앙 픽셀 색상 (RGBA):', pixels);
            
        } catch (error) {
            console.error('❌ 테스트 렌더링 실패:', error);
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }
    
    /**
     * 창 크기 변경 처리
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * 카메라 업데이트 (우주선 추적)
     */
    updateCamera(spaceshipPosition, spaceshipRotation) {
        if (!spaceshipPosition || !spaceshipRotation) return;
        
        // 위치 값 유효성 검사
        if (!isFinite(spaceshipPosition.x) || !isFinite(spaceshipPosition.y) || !isFinite(spaceshipPosition.z)) {
            return; // 비정상적인 위치 값은 무시
        }
        
        try {
            // 목표 카메라 위치 계산
            const targetPosition = spaceshipPosition.clone();
            const rotatedOffset = this.cameraOffset.clone();
            rotatedOffset.applyQuaternion(spaceshipRotation);
            targetPosition.add(rotatedOffset);
            
            // 카메라 룩앳 위치 계산
            const lookAtPosition = spaceshipPosition.clone();
            const rotatedLookOffset = this.cameraLookOffset.clone();
            rotatedLookOffset.applyQuaternion(spaceshipRotation);
            lookAtPosition.add(rotatedLookOffset);
            
            // 극단적인 카메라 위치 제한
            const maxDistance = 1000;
            if (targetPosition.length() > maxDistance) {
                targetPosition.normalize().multiplyScalar(maxDistance);
            }
            
            // 부드러운 카메라 이동
            this.camera.position.lerp(targetPosition, this.cameraSpeed);
            this.camera.lookAt(lookAtPosition);
            
        } catch (error) {
            console.error('카메라 업데이트 오류:', error);
        }
    }
    
    /**
     * 게임 루프 업데이트
     */
    update(deltaTime) {
        // 테스트 큐브 회전 (렌더링 확인용)
        if (this.testCube) {
            this.testCube.rotation.x += deltaTime;
            this.testCube.rotation.y += deltaTime * 0.5;
        }
        
        // 네뷸라 애니메이션
        if (this.nebula && this.nebula.material.uniforms) {
            this.nebula.material.uniforms.time.value += deltaTime;
        }
        
        // 행성 회전
        if (this.distantPlanets) {
            this.distantPlanets.forEach((planet, index) => {
                planet.rotation.y += deltaTime * 0.1 * (index + 1);
                planet.rotation.x += deltaTime * 0.05 * (index + 1);
            });
        }
        
        // 우주 먼지 애니메이션
        this.updateSpaceDust(deltaTime);
        
        // 조명 효과
        this.updateLights(deltaTime);
        
        // FPS 모니터링
        this.updateFPS();
    }
    
    /**
     * 우주 먼지 업데이트
     */
    updateSpaceDust(deltaTime) {
        if (!this.spaceDust) return;
        
        const positions = this.spaceDust.geometry.attributes.position.array;
        const velocities = this.spaceDust.geometry.attributes.velocity.array;
        
        // deltaTime 유효성 검사
        if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
            return; // 비정상적인 deltaTime은 무시
        }
        
        for (let i = 0; i < positions.length; i += 3) {
            // 기존 값들이 유효한지 확인
            if (isNaN(positions[i]) || isNaN(positions[i + 1]) || isNaN(positions[i + 2]) ||
                isNaN(velocities[i]) || isNaN(velocities[i + 1]) || isNaN(velocities[i + 2])) {
                
                // NaN 값이 발견되면 새로운 유효한 값으로 재설정
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 1] = (Math.random() - 0.5) * 100;
                positions[i + 2] = (Math.random() - 0.5) * 200;
                
                velocities[i] = (Math.random() - 0.5) * 0.1;
                velocities[i + 1] = (Math.random() - 0.5) * 0.1;
                velocities[i + 2] = (Math.random() - 0.5) * 0.1;
                continue;
            }
            
            const deltaMovement = deltaTime * 60;
            positions[i] += velocities[i] * deltaMovement;
            positions[i + 1] += velocities[i + 1] * deltaMovement;
            positions[i + 2] += velocities[i + 2] * deltaMovement;
            
            // 범위를 벗어나면 재배치
            if (Math.abs(positions[i]) > 100 || 
                Math.abs(positions[i + 1]) > 50 || 
                Math.abs(positions[i + 2]) > 100) {
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 1] = (Math.random() - 0.5) * 100;
                positions[i + 2] = (Math.random() - 0.5) * 200;
            }
        }
        
        this.spaceDust.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * 동적 조명 효과 업데이트
     */
    updateLights(deltaTime) {
        const time = this.clock.getElapsedTime();
        
        // 포인트 라이트 펄스 효과
        this.pointLights.forEach((light, index) => {
            const pulseSpeed = 1.5 + index * 0.5;
            const pulse = 0.5 + 0.5 * Math.sin(time * pulseSpeed);
            light.intensity = 0.3 + pulse * 0.3;
        });
    }
    
    /**
     * FPS 모니터링
     */
    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFPSCheck > 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.lastFPSCheck = now;
        }
    }
    
    /**
     * 렌더링
     */
    render() {
        try {
            // 렌더링 전 상태 확인
            if (!this.renderer || !this.scene || !this.camera) {
                console.error('렌더링 요소 누락:', {
                    renderer: !!this.renderer,
                    scene: !!this.scene,
                    camera: !!this.camera
                });
                return;
            }
            
            this.renderer.render(this.scene, this.camera);
            
        } catch (error) {
            console.error('렌더링 중 오류:', error);
        }
    }
    
    /**
     * 현재 FPS 반환
     */
    getFPS() {
        return this.currentFPS;
    }
    
    /**
     * 장면에 객체 추가
     */
    addToScene(object) {
        this.scene.add(object);
    }
    
    /**
     * 장면에서 객체 제거
     */
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    /**
     * 게임 엔진 정리
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // 메모리 정리
        this.scene.traverse((object) => {
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