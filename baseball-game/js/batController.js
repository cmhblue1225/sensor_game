/**
 * 3D 배트 컨트롤러
 * 센서 데이터를 배트 움직임으로 변환
 */

class BatController {
    constructor(engine, sensorManager) {
        this.engine = engine;
        this.sensorManager = sensorManager;
        
        // 배트 오브젝트
        this.bat = null;
        this.batGroup = null;
        
        // 배트 속성
        this.batLength = 3;
        this.batRadius = 0.1;
        this.batColor = 0x8B4513;
        
        // 스윙 상태
        this.isSwinging = false;
        this.swingPower = 0;
        this.swingSpeed = 0;
        this.swingDirection = new THREE.Vector3();
        
        // 센서 매핑 설정
        this.sensitivity = {
            rotation: 0.15,    // 회전 감도 (0.02 → 0.15로 증가)
            position: 0.5,     // 위치 감도 (0.1 → 0.5로 증가)
            swing: 0.3         // 스윙 감도 (0.05 → 0.3로 증가)
        };
        
        // 배트 위치 및 회전 (땅 위로 올리기)
        this.basePosition = new THREE.Vector3(-1, 4, -3); // y: 2 → 4로 위로 올림
        this.currentRotation = new THREE.Euler(0, 0, 0);
        this.targetRotation = new THREE.Euler(0, 0, 0);
        
        // 시뮬레이션 모드 (센서 없을 때)
        this.simulationMode = false;
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseDown = false;
        
        this.init();
    }
    
    /**
     * 배트 컨트롤러 초기화
     */
    init() {
        this.createBat();
        this.setupEventListeners();
        this.setupSensorCallback();
        this.setupSimulationMode();
    }
    
    /**
     * 3D 배트 생성
     */
    createBat() {
        this.batGroup = new THREE.Group();
        
        // 배트 손잡이
        const handleGeometry = new THREE.CylinderGeometry(
            this.batRadius * 0.8, 
            this.batRadius * 0.6, 
            this.batLength * 0.3, 
            16
        );
        const handleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513 
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -this.batLength * 0.35;
        handle.castShadow = true;
        this.batGroup.add(handle);
        
        // 배트 배럴
        const barrelGeometry = new THREE.CylinderGeometry(
            this.batRadius, 
            this.batRadius * 0.8, 
            this.batLength * 0.7, 
            16
        );
        const barrelMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xD2B48C 
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.y = this.batLength * 0.15;
        barrel.castShadow = true;
        this.batGroup.add(barrel);
        
        // 배트 끝부분
        const tipGeometry = new THREE.SphereGeometry(this.batRadius, 8, 8);
        const tipMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xD2B48C 
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.y = this.batLength * 0.5;
        tip.castShadow = true;
        this.batGroup.add(tip);
        
        // 그립 테이프
        const gripGeometry = new THREE.CylinderGeometry(
            this.batRadius * 0.85, 
            this.batRadius * 0.85, 
            this.batLength * 0.2, 
            16
        );
        const gripMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2F4F4F 
        });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.y = -this.batLength * 0.3;
        this.batGroup.add(grip);
        
        // 배트 그룹 위치 설정 (땅 위에 보이도록)
        this.batGroup.position.copy(this.basePosition);
        this.batGroup.rotation.set(-Math.PI / 8, 0, Math.PI / 12); // 회전도 약간 조정
        
        this.bat = this.batGroup;
        this.engine.addToScene(this.batGroup);
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 센서 데이터 수신
        document.addEventListener('sensorUpdate', (event) => {
            this.handleSensorData(event.detail);
        });
        
        // 게임 업데이트 이벤트
        document.addEventListener('gameUpdate', () => {
            this.update();
        });
        
        // 키보드 입력 (시뮬레이션 모드)
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.executeSwing();
            }
            if (event.code === 'KeyR') {
                this.resetBat();
            }
        });
    }
    
    /**
     * 센서 매니저 콜백 설정
     */
    setupSensorCallback() {
        if (this.sensorManager) {
            this.sensorManager.onSensorData((swingData) => {
                this.handleSwingData(swingData);
            });
        }
    }
    
    /**
     * 시뮬레이션 모드 설정
     */
    setupSimulationMode() {
        const canvas = this.engine.renderer.domElement;
        
        canvas.addEventListener('mousedown', (event) => {
            this.isMouseDown = true;
            this.updateMousePosition(event);
        });
        
        canvas.addEventListener('mousemove', (event) => {
            this.updateMousePosition(event);
            if (this.isMouseDown && this.simulationMode) {
                this.handleMouseInput();
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            if (this.isMouseDown && this.simulationMode) {
                this.executeSwing();
            }
            this.isMouseDown = false;
        });
    }
    
    /**
     * 마우스 위치 업데이트
     */
    updateMousePosition(event) {
        const rect = event.target.getBoundingClientRect();
        this.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    /**
     * 마우스 입력 처리
     */
    handleMouseInput() {
        if (!this.simulationMode) return;
        
        // 마우스 위치를 배트 회전으로 변환 (위치는 고정)
        this.batGroup.position.copy(this.basePosition); // 위치 고정
        
        this.targetRotation.x = -Math.PI / 8 + this.mousePosition.y * Math.PI / 4;
        this.targetRotation.y = this.mousePosition.x * Math.PI / 3;
        this.targetRotation.z = Math.PI / 12 + this.mousePosition.x * Math.PI / 6;
        
        // 스윙 파워 계산
        const mouseDistance = Math.sqrt(
            this.mousePosition.x * this.mousePosition.x + 
            this.mousePosition.y * this.mousePosition.y
        );
        this.swingPower = Math.min(mouseDistance * 2, 1);
    }
    
    /**
     * 센서 데이터 처리 (이벤트 기반)
     */
    handleSensorData(sensorData) {
        if (this.simulationMode || this.isSwinging) return;
        
        const { swingData } = sensorData;
        if (swingData) {
            this.handleSwingData(swingData);
        }
    }
    
    /**
     * 스윙 데이터 처리 (센서 매니저에서 직접)
     */
    handleSwingData(swingData) {
        if (this.simulationMode || this.isSwinging) return;
        
        const { x, y, z, power } = swingData;
        
        // 배트 위치는 고정하고 회전만 변경
        // x: 좌우 기울이기 → 배트 좌우 회전
        // y: 앞뒤 기울이기 → 배트 위아래 회전
        // z: 회전 → 배트 롤링
        
        // 배트는 basePosition에 고정
        this.batGroup.position.copy(this.basePosition);
        
        // 배트 회전만 센서에 따라 변경
        this.targetRotation.x = -Math.PI / 8 + y * this.sensitivity.rotation * 12; // 위아래 회전
        this.targetRotation.y = x * this.sensitivity.rotation * 15; // 좌우 회전  
        this.targetRotation.z = Math.PI / 12 + z * this.sensitivity.rotation * 8; // 배트 롤링
        
        // 스윙 파워 설정
        this.swingPower = power;
        
        // 자동 스윙 감지 (더 쉽게)
        if (power > 0.3) {
            this.executeSwing();
        }
    }
    
    /**
     * 스윙 실행
     */
    executeSwing() {
        if (this.isSwinging) return;
        
        this.isSwinging = true;
        
        // 스윙 애니메이션
        const swingDuration = 300; // 밀리초
        const startRotation = this.batGroup.rotation.clone();
        const endRotation = new THREE.Euler(
            startRotation.x - Math.PI / 3,
            startRotation.y + Math.PI / 2,
            startRotation.z + Math.PI / 4
        );
        
        const startTime = Date.now();
        
        const animateSwing = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / swingDuration, 1);
            
            // 스윙 애니메이션 곡선 (빠르게 시작해서 느려짐)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            // 회전 보간
            this.batGroup.rotation.x = startRotation.x + (endRotation.x - startRotation.x) * easeOut;
            this.batGroup.rotation.y = startRotation.y + (endRotation.y - startRotation.y) * easeOut;
            this.batGroup.rotation.z = startRotation.z + (endRotation.z - startRotation.z) * easeOut;
            
            if (progress < 1) {
                requestAnimationFrame(animateSwing);
            } else {
                // 스윙 완료
                setTimeout(() => {
                    this.resetBat();
                    this.isSwinging = false;
                }, 200);
            }
        };
        
        animateSwing();
        
        // 스윙 이벤트 발생
        this.dispatchSwingEvent();
    }
    
    /**
     * 스윙 이벤트 발생
     */
    dispatchSwingEvent() {
        const swingData = {
            power: this.swingPower,
            speed: this.swingSpeed,
            direction: this.swingDirection.clone(),
            position: this.batGroup.position.clone(),
            rotation: this.batGroup.rotation.clone(),
            timing: Date.now()
        };
        
        const swingEvent = new CustomEvent('batSwing', {
            detail: swingData
        });
        
        document.dispatchEvent(swingEvent);
    }
    
    /**
     * 배트 위치 리셋
     */
    resetBat() {
        if (this.isSwinging) return;
        
        // 부드러운 리셋 애니메이션
        const resetDuration = 500;
        const startRotation = this.batGroup.rotation.clone();
        const startPosition = this.batGroup.position.clone();
        const targetRotation = new THREE.Euler(-Math.PI / 8, 0, Math.PI / 12);
        
        const startTime = Date.now();
        
        const animateReset = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / resetDuration, 1);
            
            // 부드러운 애니메이션 곡선
            const easeInOut = 0.5 * (1 - Math.cos(Math.PI * progress));
            
            // 회전 보간
            this.batGroup.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeInOut;
            this.batGroup.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easeInOut;
            this.batGroup.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * easeInOut;
            
            // 위치 보간
            this.batGroup.position.x = startPosition.x + (this.basePosition.x - startPosition.x) * easeInOut;
            this.batGroup.position.y = startPosition.y + (this.basePosition.y - startPosition.y) * easeInOut;
            this.batGroup.position.z = startPosition.z + (this.basePosition.z - startPosition.z) * easeInOut;
            
            if (progress < 1) {
                requestAnimationFrame(animateReset);
            }
        };
        
        animateReset();
    }
    
    /**
     * 업데이트 (매 프레임 호출)
     */
    update() {
        if (this.isSwinging) return;
        
        // 더 빠른 회전 보간 (0.1 → 0.3으로 증가)
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.3;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.3;
        this.currentRotation.z += (this.targetRotation.z - this.currentRotation.z) * 0.3;
        
        this.batGroup.rotation.copy(this.currentRotation);
    }
    
    /**
     * 시뮬레이션 모드 설정
     */
    setSimulationMode(enabled) {
        this.simulationMode = enabled;
        
        // UI 업데이트
        const simulationUI = document.getElementById('simulationMode');
        if (simulationUI) {
            simulationUI.classList.toggle('show', enabled);
        }
    }
    
    /**
     * 배트 위치 가져오기
     */
    getBatPosition() {
        return this.batGroup.position.clone();
    }
    
    /**
     * 배트 회전 가져오기
     */
    getBatRotation() {
        return this.batGroup.rotation.clone();
    }
    
    /**
     * 스윙 상태 확인
     */
    getIsSwinging() {
        return this.isSwinging;
    }
    
    /**
     * 스윙 파워 가져오기
     */
    getSwingPower() {
        return this.swingPower;
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        if (this.batGroup) {
            this.engine.removeFromScene(this.batGroup);
            this.batGroup = null;
            this.bat = null;
        }
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.BatController = BatController;
}