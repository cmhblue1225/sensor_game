/**
 * 3D Runner Game - 완전히 새로 작성된 버전
 * 모든 장애물이 플레이어 쪽으로 올바르게 이동하는 런너 게임
 */

// 전역 변수
let scene, camera, renderer, clock;
let gameState = 'menu'; // menu, playing, gameOver
let gameSpeed = 8;
let score = 0, distance = 0, level = 1;

// 설정값
let settings = {
    sensitivity: 1.0, // 기본 감도를 높여서 반응성 향상
    initialSpeed: 8,
    soundVolume: 50
};

// 게임 객체들
let character = null;
let obstacles = [];
let coins = [];
let track = null;

// 레인 설정
const LANE_COUNT = 3;
const LANE_WIDTH = 4;
const TRACK_WIDTH = LANE_COUNT * LANE_WIDTH;

// 캐릭터 설정
let characterPosition = { x: 0, y: 1, z: 0 };
let currentLane = 1; // 중앙 레인 시작
let targetLane = 1;
let isJumping = false;
let jumpVelocity = 0;
const JUMP_POWER = 12;
const GRAVITY = -25;

// 센서 연결
let sensorData = { tilt: 0, connected: false };
let ws = null;
let deviceId = 'Runner-Game-' + Math.random().toString(36).substr(2, 9);

/**
 * 게임 초기화
 */
function initGame() {
    console.log('🎮 3D Runner 게임 초기화 시작...');
    
    // Three.js 기본 설정
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    
    // 카메라 설정
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 0, 0);
    
    // 렌더러 설정
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('gameCanvas'),
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 씬 설정
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    // 조명 설정
    setupLights();
    
    // 환경 생성
    createEnvironment();
    
    // 캐릭터 생성
    createCharacter();
    
    // 센서 연결 시도
    connectToSensor();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    console.log('✅ 게임 초기화 완료!');
}

/**
 * 조명 설정
 */
function setupLights() {
    // 주변광
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // 방향광
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
}

/**
 * 환경 생성
 */
function createEnvironment() {
    // 트랙 생성
    const trackGeometry = new THREE.PlaneGeometry(TRACK_WIDTH, 200);
    const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.receiveShadow = true;
    scene.add(track);
    
    // 레인 구분선
    for (let i = 1; i < LANE_COUNT; i++) {
        const lineGeometry = new THREE.PlaneGeometry(0.2, 200);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.x = (i * LANE_WIDTH) - (TRACK_WIDTH / 2);
        line.position.y = 0.01;
        scene.add(line);
    }
    
    // 지형
    const terrainGeometry = new THREE.PlaneGeometry(400, 400);
    const terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.1;
    terrain.receiveShadow = true;
    scene.add(terrain);
}

/**
 * 캐릭터 생성
 */
function createCharacter() {
    const group = new THREE.Group();
    
    // 몸체
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 12);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4169E1 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);
    
    // 머리
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFDBB3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    group.add(head);
    
    character = group;
    character.position.set(0, 1, 0);
    scene.add(character);
}

/**
 * 레인 X 좌표 계산
 */
function getLaneX(laneIndex) {
    return (laneIndex - 1) * LANE_WIDTH; // -4, 0, 4
}

/**
 * 장애물 생성
 */
function createObstacle(type, lane, z) {
    let geometry, material, mesh;
    
    switch (type) {
        case 'wall':
            geometry = new THREE.BoxGeometry(3, 3, 1);
            material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            break;
        case 'barrier':
            geometry = new THREE.BoxGeometry(3, 1, 1);
            material = new THREE.MeshPhongMaterial({ color: 0xFF6347 });
            break;
        case 'pit':
            geometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
            material = new THREE.MeshPhongMaterial({ color: 0x2F2F2F });
            break;
    }
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(getLaneX(lane), type === 'pit' ? -0.5 : 1.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const obstacle = {
        mesh: mesh,
        type: type,
        lane: lane,
        z: z
    };
    
    obstacles.push(obstacle);
    scene.add(mesh);
    
    console.log(`장애물 생성: ${type} at lane ${lane}, z=${z}`);
}

/**
 * 코인 생성
 */
function createCoin(lane, z) {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700,
        emissive: 0x222200 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(getLaneX(lane), 1.5, z);
    mesh.castShadow = true;
    
    const coin = {
        mesh: mesh,
        lane: lane,
        z: z
    };
    
    coins.push(coin);
    scene.add(mesh);
    
    console.log(`코인 생성: lane ${lane}, z=${z}`);
}

/**
 * 초기 장애물 배치
 */
function generateInitialObstacles() {
    // 캐릭터 앞쪽에 장애물들 배치
    for (let i = 1; i <= 10; i++) {
        const z = -30 - (i * 15); // -45, -60, -75, -90, ...
        
        // 랜덤 패턴 생성
        const pattern = Math.floor(Math.random() * 3);
        
        if (pattern === 0) {
            // 단일 레인 장애물
            const lane = Math.floor(Math.random() * 3);
            const type = Math.random() < 0.6 ? 'wall' : 'barrier';
            createObstacle(type, lane, z);
            
            // 다른 레인에 코인 배치
            for (let l = 0; l < 3; l++) {
                if (l !== lane && Math.random() < 0.5) {
                    createCoin(l, z);
                }
            }
        } else if (pattern === 1) {
            // 두 레인 장애물
            const lanes = [0, 1, 2];
            const blockedLanes = lanes.splice(Math.floor(Math.random() * 3), 1);
            const secondLane = lanes[Math.floor(Math.random() * 2)];
            blockedLanes.push(secondLane);
            
            blockedLanes.forEach(lane => {
                createObstacle('wall', lane, z);
            });
            
            // 빈 레인에 코인
            const freeLane = [0, 1, 2].find(l => !blockedLanes.includes(l));
            if (freeLane !== undefined) {
                createCoin(freeLane, z);
            }
        } else {
            // 모든 레인에 낮은 장벽 (점프 필요)
            createObstacle('barrier', 1, z); // 중앙에만
        }
    }
}

/**
 * 새로운 장애물 스폰
 */
function spawnNewObstacles() {
    const spawnZ = -150; // 생성 위치
    
    // 패턴 선택
    const pattern = Math.floor(Math.random() * 3);
    
    if (pattern === 0) {
        // 단일 장애물
        const lane = Math.floor(Math.random() * 3);
        const type = Math.random() < 0.7 ? 'wall' : 'barrier';
        createObstacle(type, lane, spawnZ);
        
        // 코인 배치
        for (let l = 0; l < 3; l++) {
            if (l !== lane && Math.random() < 0.4) {
                createCoin(l, spawnZ);
            }
        }
    } else if (pattern === 1) {
        // 두 레인 블록
        const freeLane = Math.floor(Math.random() * 3);
        for (let l = 0; l < 3; l++) {
            if (l !== freeLane) {
                createObstacle('wall', l, spawnZ);
            }
        }
        createCoin(freeLane, spawnZ);
    } else {
        // 점프 패턴
        createObstacle('barrier', 1, spawnZ);
        if (Math.random() < 0.3) {
            createCoin(0, spawnZ);
        }
        if (Math.random() < 0.3) {
            createCoin(2, spawnZ);
        }
    }
}

/**
 * 장애물 업데이트
 */
function updateObstacles(deltaTime) {
    const moveDistance = gameSpeed * deltaTime;
    
    // 장애물 이동
    obstacles.forEach((obstacle, index) => {
        obstacle.z += moveDistance;
        obstacle.mesh.position.z = obstacle.z;
        
        // 화면 밖으로 나간 장애물 제거
        if (obstacle.z > 20) {
            scene.remove(obstacle.mesh);
            obstacle.mesh.geometry.dispose();
            obstacle.mesh.material.dispose();
            obstacles.splice(index, 1);
        }
    });
    
    // 코인 이동
    coins.forEach((coin, index) => {
        coin.z += moveDistance;
        coin.mesh.position.z = coin.z;
        coin.mesh.rotation.y += deltaTime * 3; // 회전 효과
        
        // 화면 밖으로 나간 코인 제거
        if (coin.z > 20) {
            scene.remove(coin.mesh);
            coin.mesh.geometry.dispose();
            coin.mesh.material.dispose();
            coins.splice(index, 1);
        }
    });
    
    // 새로운 장애물 생성 필요 확인
    if (obstacles.length < 8) {
        spawnNewObstacles();
    }
}

/**
 * 캐릭터 업데이트
 */
function updateCharacter(deltaTime) {
    // 레인 변경 처리
    const targetX = getLaneX(targetLane);
    const currentX = characterPosition.x;
    const deltaX = targetX - currentX;
    
    if (Math.abs(deltaX) > 0.1) {
        characterPosition.x += deltaX * 8 * deltaTime; // 레인 변경 속도
    } else {
        characterPosition.x = targetX;
        currentLane = targetLane;
    }
    
    // 점프 물리
    if (isJumping) {
        jumpVelocity += GRAVITY * deltaTime;
        characterPosition.y += jumpVelocity * deltaTime;
        
        if (characterPosition.y <= 1) {
            characterPosition.y = 1;
            jumpVelocity = 0;
            isJumping = false;
        }
    }
    
    // 캐릭터 위치 적용
    character.position.set(characterPosition.x, characterPosition.y, characterPosition.z);
    
    // 카메라 업데이트
    const targetCameraX = characterPosition.x * 0.3;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraX, 0.1);
    camera.lookAt(characterPosition.x, 1, 0);
}

/**
 * 충돌 감지
 */
function checkCollisions() {
    const characterBox = new THREE.Box3().setFromObject(character);
    
    // 장애물과 충돌 확인
    obstacles.forEach((obstacle, index) => {
        if (Math.abs(obstacle.z - characterPosition.z) < 2) {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
            
            if (characterBox.intersectsBox(obstacleBox)) {
                if (obstacle.type === 'barrier' && isJumping && characterPosition.y > 2) {
                    // 점프로 장벽 통과
                    return;
                }
                
                // 충돌 발생
                gameOver();
                return;
            }
        }
    });
    
    // 코인과 충돌 확인
    coins.forEach((coin, index) => {
        if (Math.abs(coin.z - characterPosition.z) < 2) {
            const coinBox = new THREE.Box3().setFromObject(coin.mesh);
            
            if (characterBox.intersectsBox(coinBox)) {
                // 코인 수집
                score += 100;
                scene.remove(coin.mesh);
                coin.mesh.geometry.dispose();
                coin.mesh.material.dispose();
                coins.splice(index, 1);
                
                updateUI();
            }
        }
    });
}

/**
 * UI 업데이트
 */
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('distance').textContent = Math.floor(distance);
    document.getElementById('speed').textContent = Math.floor(gameSpeed);
    document.getElementById('level').textContent = level;
    document.getElementById('tilt').textContent = sensorData.tilt.toFixed(2);
    document.getElementById('sensorStatus').textContent = 
        sensorData.connected ? '📱 센서: 연결됨' : '📱 센서: 연결 안됨';
}

// 센서 스무딩을 위한 변수들
let tiltHistory = [];
const TILT_HISTORY_SIZE = 8; // 안정성을 위해 히스토리 크기 증가

/**
 * 센서 입력 처리 - 직접 레인 선택 방식
 */
function handleSensorInput() {
    if (!sensorData.connected) return;
    
    // 기본 기울기 값
    let rawTilt = sensorData.tilt;
    
    // 기울기 히스토리에 추가 (스무딩)
    tiltHistory.push(rawTilt);
    if (tiltHistory.length > TILT_HISTORY_SIZE) {
        tiltHistory.shift();
    }
    
    // 평균값 계산 (스무딩)
    const avgTilt = tiltHistory.reduce((sum, val) => sum + val, 0) / tiltHistory.length;
    
    // 감도 적용
    const processedTilt = avgTilt * settings.sensitivity;
    
    // 레인 구분 임계값 (적절한 기울기로 조정)
    const leftThreshold = -8.0;    // 왼쪽 레인으로 가는 기준
    const rightThreshold = 8.0;    // 오른쪽 레인으로 가는 기준
    const centerZone = 3.0;        // 가운데 레인 유지 구간 (±3도)
    
    let newTargetLane;
    
    if (processedTilt < leftThreshold) {
        // 왼쪽으로 많이 기울어짐 → 왼쪽 레인(0)
        newTargetLane = 0;
    } else if (processedTilt > rightThreshold) {
        // 오른쪽으로 많이 기울어짐 → 오른쪽 레인(2)
        newTargetLane = 2;
    } else if (Math.abs(processedTilt) < centerZone) {
        // 가운데 유지 → 가운데 레인(1)
        newTargetLane = 1;
    } else {
        // 애매한 구간에서는 현재 레인 유지
        newTargetLane = targetLane;
    }
    
    // 레인 변경
    if (newTargetLane !== targetLane) {
        targetLane = newTargetLane;
        console.log(`🎯 레인 변경: ${currentLane} → ${targetLane}, 기울기: ${processedTilt.toFixed(2)}`);
    }
    
    // 디버깅을 위한 상세 로그 (5초마다)
    if (!handleSensorInput.lastLogTime || Date.now() - handleSensorInput.lastLogTime > 5000) {
        console.log(`📊 센서 상태: 원본=${rawTilt.toFixed(2)}, 처리됨=${processedTilt.toFixed(2)}, 현재레인=${currentLane}, 목표레인=${targetLane}`);
        handleSensorInput.lastLogTime = Date.now();
    }
}

/**
 * 센서 연결
 */
function connectToSensor() {
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = window.location.protocol === 'https:' ? '8443' : '8080';
        const wsUrl = `${protocol}//${window.location.hostname}:${port}`;
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
            console.log('센서 WebSocket 연결됨');
            sensorData.connected = true;
            
            // 게임 클라이언트로 등록
            ws.send(JSON.stringify({
                type: 'game_client_register',
                deviceId: deviceId,
                timestamp: Date.now()
            }));
            
            updateUI();
        };
        
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'sensor_data') {
                    // 센서 데이터 처리
                    const orientation = data.data?.orientation;
                    if (orientation) {
                        sensorData.tilt = orientation.gamma || 0;
                        console.log('센서 데이터 수신:', sensorData.tilt);
                    }
                    updateUI();
                } else if (data.type === 'sensor') {
                    // 이전 형식도 지원
                    sensorData.tilt = data.orientation?.gamma || 0;
                    updateUI();
                }
            } catch (error) {
                console.error('센서 데이터 파싱 오류:', error);
            }
        };
        
        ws.onclose = function() {
            console.log('센서 WebSocket 연결 끊어짐');
            sensorData.connected = false;
            updateUI();
            
            // 재연결 시도
            setTimeout(connectToSensor, 3000);
        };
        
        ws.onerror = function(error) {
            console.error('센서 WebSocket 오류:', error);
            sensorData.connected = false;
            updateUI();
        };
    } catch (error) {
        console.error('센서 연결 실패:', error);
        sensorData.connected = false;
        updateUI();
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 키보드 입력
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                if (gameState === 'playing') {
                    targetLane = Math.max(0, targetLane - 1);
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (gameState === 'playing') {
                    targetLane = Math.min(2, targetLane + 1);
                }
                break;
            case 'Space':
                if (gameState === 'playing') {
                    e.preventDefault();
                    jump();
                }
                break;
            case 'Escape':
                // ESC 키로 메인 허브로 이동
                e.preventDefault();
                if (confirm('메인 허브로 돌아가시겠습니까?')) {
                    goToHub();
                }
                break;
        }
    });
    
    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/**
 * 점프
 */
function jump() {
    if (!isJumping) {
        isJumping = true;
        jumpVelocity = JUMP_POWER;
    }
}

/**
 * 게임 시작
 */
function startGame() {
    gameState = 'playing';
    score = 0;
    distance = 0;
    level = 1;
    gameSpeed = settings.initialSpeed;
    
    // 캐릭터 초기화
    characterPosition = { x: 0, y: 1, z: 0 };
    currentLane = 1;
    targetLane = 1;
    isJumping = false;
    jumpVelocity = 0;
    
    // 기존 장애물 제거
    obstacles.forEach(obstacle => {
        scene.remove(obstacle.mesh);
        obstacle.mesh.geometry.dispose();
        obstacle.mesh.material.dispose();
    });
    obstacles = [];
    
    coins.forEach(coin => {
        scene.remove(coin.mesh);
        coin.mesh.geometry.dispose();
        coin.mesh.material.dispose();
    });
    coins = [];
    
    // 새로운 장애물 생성
    generateInitialObstacles();
    
    // 모든 화면 숨기기
    hideAllScreens();
    
    // 게임 루프 시작
    gameLoop();
    
    console.log('🏃‍♂️ 게임 시작!');
}

/**
 * 게임 오버
 */
function gameOver() {
    gameState = 'gameOver';
    
    // 최종 점수 표시
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalDistance').textContent = Math.floor(distance);
    
    // 모든 화면 숨기고 게임 오버 화면 표시
    hideAllScreens();
    document.getElementById('gameOverScreen').style.display = 'flex';
    
    console.log('💀 게임 오버! 점수:', score);
}

/**
 * 게임 재시작
 */
function restartGame() {
    startGame();
}

/**
 * 게임 루프
 */
function gameLoop() {
    if (gameState !== 'playing') return;
    
    const deltaTime = clock.getDelta();
    
    // 센서 입력 처리
    handleSensorInput();
    
    // 캐릭터 업데이트
    updateCharacter(deltaTime);
    
    // 장애물 업데이트
    updateObstacles(deltaTime);
    
    // 충돌 감지
    checkCollisions();
    
    // 거리 및 속도 증가
    distance += gameSpeed * deltaTime;
    gameSpeed = Math.min(15, 8 + distance / 100);
    level = Math.floor(distance / 500) + 1;
    
    // UI 업데이트
    updateUI();
    
    // 렌더링
    renderer.render(scene, camera);
    
    // 다음 프레임
    requestAnimationFrame(gameLoop);
}

/**
 * 화면 전환 함수들
 */
function showMainMenu() {
    hideAllScreens();
    document.getElementById('mainMenu').style.display = 'flex';
    gameState = 'menu';
}

function showInstructions() {
    hideAllScreens();
    document.getElementById('instructionsScreen').style.display = 'flex';
}

function showSettings() {
    hideAllScreens();
    document.getElementById('settingsScreen').style.display = 'flex';
    initializeSettings();
}

function hideAllScreens() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('instructionsScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
}

/**
 * 설정 초기화
 */
function initializeSettings() {
    // 센서 감도 슬라이더
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    const sensitivityValue = document.getElementById('sensitivityValue');
    if (sensitivitySlider && sensitivityValue) {
        sensitivitySlider.value = settings.sensitivity;
        sensitivityValue.textContent = settings.sensitivity;
        
        // 기존 이벤트 리스너 제거 후 새로 추가
        sensitivitySlider.removeEventListener('input', updateSensitivity);
        sensitivitySlider.addEventListener('input', updateSensitivity);
    }
    
    // 게임 속도 슬라이더
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    if (speedSlider && speedValue) {
        speedSlider.value = settings.initialSpeed;
        speedValue.textContent = settings.initialSpeed;
        
        speedSlider.removeEventListener('input', updateSpeed);
        speedSlider.addEventListener('input', updateSpeed);
    }
    
    // 음향 효과 슬라이더
    const soundSlider = document.getElementById('soundSlider');
    const soundValue = document.getElementById('soundValue');
    if (soundSlider && soundValue) {
        soundSlider.value = settings.soundVolume;
        soundValue.textContent = settings.soundVolume;
        
        soundSlider.removeEventListener('input', updateSound);
        soundSlider.addEventListener('input', updateSound);
    }
}

// 설정 업데이트 함수들
function updateSensitivity(e) {
    settings.sensitivity = parseFloat(e.target.value);
    document.getElementById('sensitivityValue').textContent = settings.sensitivity;
}

function updateSpeed(e) {
    settings.initialSpeed = parseInt(e.target.value);
    document.getElementById('speedValue').textContent = settings.initialSpeed;
}

function updateSound(e) {
    settings.soundVolume = parseInt(e.target.value);
    document.getElementById('soundValue').textContent = settings.soundVolume;
}

/**
 * 일시정지 기능
 */
function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        showMainMenu();
    }
}

/**
 * 센서 연결 상태 업데이트
 */
function updateConnectionStatus() {
    const indicator = document.getElementById('connectionIndicator');
    const sensorStatus = document.getElementById('sensorStatus');
    
    if (sensorData.connected) {
        indicator.textContent = '📡 센서 연결됨';
        indicator.style.color = '#4ecdc4';
        if (sensorStatus) {
            sensorStatus.textContent = '📱 센서: 연결됨';
        }
    } else {
        indicator.textContent = '📡 센서 연결 대기중...';
        indicator.style.color = '#ff6b6b';
        if (sensorStatus) {
            sensorStatus.textContent = '📱 센서: 연결 안됨';
        }
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupUIEventListeners() {
    // 메인 메뉴 버튼들
    document.getElementById('startGameBtn')?.addEventListener('click', startGame);
    document.getElementById('instructionsBtn')?.addEventListener('click', showInstructions);
    document.getElementById('settingsBtn')?.addEventListener('click', showSettings);
    document.getElementById('hubBtn')?.addEventListener('click', goToHub);
    
    // 조작법/설정 화면의 뒤로가기 버튼
    document.getElementById('backToMenuFromInstructions')?.addEventListener('click', showMainMenu);
    document.getElementById('backToMenuFromSettings')?.addEventListener('click', showMainMenu);
    
    // 게임 오버 화면 버튼들
    document.getElementById('restartBtn')?.addEventListener('click', restartGame);
    document.getElementById('mainMenuBtn')?.addEventListener('click', showMainMenu);
    
    // 게임 플레이 중 버튼들
    document.getElementById('pauseBtn')?.addEventListener('click', pauseGame);
    document.getElementById('exitBtn')?.addEventListener('click', goToHub);
}

/**
 * 페이지 로드 시 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 게임 초기화 시작...');
    
    // UI 이벤트 리스너 설정
    setupUIEventListeners();
    
    // 메인 메뉴 표시
    showMainMenu();
    
    // 게임 초기화
    initGame();
    
    // 설정 초기화
    initializeSettings();
    
    // 연결 상태 업데이트
    setInterval(updateConnectionStatus, 1000);
});

/**
 * 메인 허브로 이동
 */
function goToHub() {
    // 게임 정리
    if (gameState === 'playing') {
        gameState = 'menu';
    }
    
    // 메인 허브로 이동
    window.location.href = '/';
}

// 전역 함수들은 이제 이벤트 리스너로 처리됨