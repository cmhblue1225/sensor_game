/**
 * 3D 야구 게임 엔진
 * Three.js 기반 3D 환경 구현
 */

class BaseballEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = [];
        
        // 게임 오브젝트들
        this.stadium = null;
        this.mound = null;
        this.plate = null;
        this.crowd = [];
        
        this.animationId = null;
        this.isRunning = false;
        
        this.init();
    }
    
    /**
     * 3D 엔진 초기화
     */
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.setupStadium();
        this.setupEventListeners();
        
        this.start();
    }
    
    /**
     * 렌더러 설정
     */
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB, 1); // 하늘색 배경
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    /**
     * 씬 설정
     */
    setupScene() {
        this.scene = new THREE.Scene();
        
        // 안개 효과 추가
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);
    }
    
    /**
     * 카메라 설정
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        // 타자 뒤편에서 투수를 바라보는 시점
        this.camera.position.set(0, 5, -15);
        this.camera.lookAt(0, 2, 0);
    }
    
    /**
     * 조명 설정
     */
    setupLights() {
        // 주변광
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // 메인 조명 (태양)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // 스타디움 조명들
        this.setupStadiumLights();
    }
    
    /**
     * 스타디움 조명 설정
     */
    setupStadiumLights() {
        const positions = [
            [-30, 25, 20],
            [30, 25, 20],
            [-30, 25, -20],
            [30, 25, -20]
        ];
        
        positions.forEach(pos => {
            const light = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 6, 0.5);
            light.position.set(pos[0], pos[1], pos[2]);
            light.target.position.set(0, 0, 0);
            light.castShadow = true;
            this.scene.add(light);
            this.scene.add(light.target);
            this.lights.push(light);
        });
    }
    
    /**
     * 야구장 설정
     */
    setupStadium() {
        this.createGround();
        this.createMound();
        this.createHomePlate();
        this.createBatterBox();
        this.createStands();
        this.createScoreboard();
    }
    
    /**
     * 그라운드 생성
     */
    createGround() {
        // 메인 그라운드
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22 
        }); // 잔디 색
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // 내야 다이아몬드
        const diamondGeometry = new THREE.RingGeometry(10, 25, 4, 1);
        const diamondMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xCD853F 
        }); // 흙 색
        
        const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial);
        diamond.rotation.x = -Math.PI / 2;
        diamond.rotation.z = Math.PI / 4;
        diamond.position.y = 0.01;
        this.scene.add(diamond);
    }
    
    /**
     * 투수 마운드 생성
     */
    createMound() {
        const moundGeometry = new THREE.CylinderGeometry(2, 3, 0.5, 16);
        const moundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xCD853F 
        });
        
        this.mound = new THREE.Mesh(moundGeometry, moundMaterial);
        this.mound.position.set(0, 0.25, 18);
        this.mound.castShadow = true;
        this.scene.add(this.mound);
        
        // 투수판
        const plateGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.3);
        const plateMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff 
        });
        
        const pitcherPlate = new THREE.Mesh(plateGeometry, plateMaterial);
        pitcherPlate.position.set(0, 0.55, 18);
        this.scene.add(pitcherPlate);
    }
    
    /**
     * 홈플레이트 생성
     */
    createHomePlate() {
        const plateGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 5);
        const plateMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff 
        });
        
        this.plate = new THREE.Mesh(plateGeometry, plateMaterial);
        this.plate.position.set(0, 0.05, -2);
        this.plate.rotation.y = Math.PI / 10;
        this.scene.add(this.plate);
    }
    
    /**
     * 타석 생성
     */
    createBatterBox() {
        // 좌타석
        const leftBoxGeometry = new THREE.PlaneGeometry(2, 3);
        const boxMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xCD853F,
            transparent: true,
            opacity: 0.8
        });
        
        const leftBox = new THREE.Mesh(leftBoxGeometry, boxMaterial);
        leftBox.rotation.x = -Math.PI / 2;
        leftBox.position.set(-1.5, 0.02, -2);
        this.scene.add(leftBox);
        
        // 우타석
        const rightBox = new THREE.Mesh(leftBoxGeometry, boxMaterial);
        rightBox.rotation.x = -Math.PI / 2;
        rightBox.position.set(1.5, 0.02, -2);
        this.scene.add(rightBox);
    }
    
    /**
     * 관중석 생성
     */
    createStands() {
        const positions = [
            { x: -60, z: 0, rotation: Math.PI / 2 },
            { x: 60, z: 0, rotation: -Math.PI / 2 },
            { x: 0, z: 60, rotation: 0 }
        ];
        
        positions.forEach(pos => {
            const standGeometry = new THREE.BoxGeometry(40, 15, 5);
            const standMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8B4513 
            });
            
            const stand = new THREE.Mesh(standGeometry, standMaterial);
            stand.position.set(pos.x, 7.5, pos.z);
            stand.rotation.y = pos.rotation;
            stand.castShadow = true;
            this.scene.add(stand);
            
            this.createCrowd(stand);
        });
    }
    
    /**
     * 관중 생성
     */
    createCrowd(stand) {
        const crowdCount = 50;
        const crowdGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const crowdColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0x6c5ce7];
        
        for (let i = 0; i < crowdCount; i++) {
            const color = crowdColors[Math.floor(Math.random() * crowdColors.length)];
            const crowdMaterial = new THREE.MeshLambertMaterial({ color });
            
            const person = new THREE.Mesh(crowdGeometry, crowdMaterial);
            person.position.set(
                stand.position.x + (Math.random() - 0.5) * 35,
                stand.position.y + Math.random() * 10 + 5,
                stand.position.z + (Math.random() - 0.5) * 4
            );
            
            this.scene.add(person);
            this.crowd.push(person);
        }
    }
    
    /**
     * 전광판 생성
     */
    createScoreboard() {
        const boardGeometry = new THREE.BoxGeometry(15, 8, 1);
        const boardMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2c3e50 
        });
        
        const scoreboard = new THREE.Mesh(boardGeometry, boardMaterial);
        scoreboard.position.set(0, 20, 80);
        this.scene.add(scoreboard);
        
        // 스코어보드 텍스트는 실제 구현에서 캔버스 텍스처로 구현
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    /**
     * 애니메이션 시작
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }
    
    /**
     * 애니메이션 중지
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isRunning = false;
    }
    
    /**
     * 애니메이션 루프
     */
    animate() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // 관중 애니메이션 (살짝 움직임)
        this.crowd.forEach((person, index) => {
            person.rotation.y += Math.sin(Date.now() * 0.001 + index) * 0.01;
        });
        
        // 게임 시스템 업데이트 이벤트 발생
        const updateEvent = new CustomEvent('gameUpdate', {
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(updateEvent);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * 오브젝트를 씬에 추가
     */
    addToScene(object) {
        this.scene.add(object);
    }
    
    /**
     * 오브젝트를 씬에서 제거
     */
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        this.stop();
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
        
        // 메모리 정리
        this.scene?.clear();
        this.lights.length = 0;
        this.crowd.length = 0;
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.BaseballEngine = BaseballEngine;
}