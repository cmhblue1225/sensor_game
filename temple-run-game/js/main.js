import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

class SensorManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.deviceId = 'TempleRunGame-' + Math.random().toString(36).substr(2, 9);
        
        this.sensorData = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            gyroscope: { alpha: 0, beta: 0, gamma: 0 },
            timestamp: Date.now()
        };
        
        this.tiltInput = {
            x: 0,       
            y: 0,       
            brake: 0,   
            handbrake: 0
        };
        
        this.callbacks = [];
    }
    
    connectToServer() {
        try {
            const serverHost = window.location.hostname || 'localhost';
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const serverPort = protocol === 'wss' ? '8443' : '8080';
            
            this.socket = new WebSocket(`${protocol}://${serverHost}:${serverPort}`);
            
            this.socket.onopen = () => {
                this.isConnected = true;
                console.log('🎮 [TempleRunGame] 센서 시스템 연결 성공');
                document.getElementById('sensorConnection').textContent = '📡 센서 연결됨';
                this.socket.send(JSON.stringify({ 
                    type: 'game_client_register', 
                    deviceId: this.deviceId,
                    gameType: 'temple_run_game',
                    capabilities: ['orientation', 'accelerometer', 'gyroscope']
                }));
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'sensor_data') {
                        this.processSensorData(data.data);
                    }
                } catch (error) {
                    console.error('센서 데이터 처리 오류:', error);
                }
            };
            
            this.socket.onclose = () => {
                this.isConnected = false;
                console.log('센서 연결 끊김. 시뮬레이션 모드로 전환...');
                document.getElementById('sensorConnection').textContent = '🔌 시뮬레이션 모드';
                this.startSimulationMode();
            };
            
            this.socket.onerror = () => {
                console.error('센서 연결 오류. 시뮬레이션 모드 시작...');
                document.getElementById('sensorConnection').textContent = '🔌 시뮬레이션 모드';
                this.startSimulationMode();
            };
            
        } catch (error) {
            console.error('센서 서버 연결 실패:', error);
            this.startSimulationMode();
        }
    }
    
    processSensorData(data) {
        this.sensorData.timestamp = Date.now();
        
        if (data.orientation) {
            this.sensorData.orientation = data.orientation;
        }
        if (data.accelerometer) {
            this.sensorData.accelerometer = data.accelerometer;
        }
        if (data.gyroscope) {
            this.sensorData.gyroscope = data.gyroscope;
        }
        
        this.convertToGameInput();
        
        this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
    }
    
    convertToGameInput() {
        const orientation = this.sensorData.orientation;
        this.tiltInput.x = this.clamp((orientation.gamma || 0) / 45, -1, 1);
        this.tiltInput.y = this.clamp((orientation.beta || 0) / 45, -1, 1);
        
        const accel = this.sensorData.accelerometer;
        if (accel) {
            const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
            if (magnitude > 20) { // Jump threshold
                this.tiltInput.handbrake = 1.0;
                setTimeout(() => { this.tiltInput.handbrake = 0; }, 500);
            }
        }
    }
    
    startSimulationMode() {
        if (this.simulationInterval) return;
        
        console.warn('🎮 시뮬레이션 모드 시작 (WASD/화살표 키)');
        this.isConnected = false;
        
        const keys = {};
        document.addEventListener('keydown', (e) => { keys[e.code] = true; });
        document.addEventListener('keyup', (e) => { keys[e.code] = false; });
        
        this.simulationInterval = setInterval(() => {
            let targetX = 0, targetY = 0;
            
            if (keys['KeyA'] || keys['ArrowLeft']) targetX = -1;
            if (keys['KeyD'] || keys['ArrowRight']) targetX = 1;
            if (keys['KeyW'] || keys['ArrowUp']) targetY = 1;
            if (keys['KeyS'] || keys['ArrowDown']) targetY = -1;
            
            this.tiltInput.x = this.lerp(this.tiltInput.x, targetX, 0.1);
            this.tiltInput.y = this.lerp(this.tiltInput.y, targetY, 0.1);
            this.tiltInput.brake = keys['Space'] ? 1 : 0;
            
            this.callbacks.forEach(cb => cb(this.tiltInput, this.sensorData));
        }, 16);
    }
    
    onSensorData(callback) {
        this.callbacks.push(callback);
    }
    
    getTiltInput() {
        return { ...this.tiltInput };
    }
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
}

class TempleRunGame {
    constructor() {
        // Game state and properties
        this.gameState = { isPlaying: false };
        this.score = 0;
        this.gameSpeed = 0.2; // Increased speed
        this.lastTime = 0;

        // Player properties
        this.player = null;
        this.playerState = {
            isJumping: false,
            isSliding: false,
            jumpVelocity: 0,
            slideTimer: 0,
        };
        this.lanes = [-3, 0, 3];
        this.currentLane = 1;

        // World properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.obstacles = [];
        this.coins = [];
        this.obstacleSpawnTimer = 0;

        // Sensor and input
        this.sensorManager = new SensorManager();
        this.sensorManager.onSensorData((tiltInput) => {
            this.handleSensorInput(tiltInput);
        });
        this.inputCooldown = {
            laneChange: 0,
            jump: 0,
            slide: 0,
        };
    }

    init() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        document.getElementById('loadingScreen').style.display = 'none';

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x004466);
        this.scene.fog = new THREE.Fog(0x004466, 50, 150);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10); // Adjusted camera position
        this.camera.lookAt(0, 2, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('gameCanvas') });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xcccccc);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Environment
        this.createPath();

        // Player
        this.createPlayer();

        // Event Listeners
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Sensor setup
        this.sensorManager.connectToServer();
        this.sensorManager.onSensorData((tiltInput) => {
            this.handleSensorInput(tiltInput);
        });

        this.startGameLoop();
    }

    createPath() {
        const groundGeometry = new THREE.PlaneGeometry(12, 2000); // Much longer path
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createPlayer() {
        const playerBodyGeometry = new THREE.BoxGeometry(1, 1.8, 0.8); // Taller player
        const playerBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        this.player = new THREE.Mesh(playerBodyGeometry, playerBodyMaterial);
        this.player.position.set(0, 0.9, 0);
        this.player.castShadow = true;
        this.scene.add(this.player);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleSensorInput(tiltInput) {
        const now = performance.now();

        // Lane change (left/right)
        if (now > this.inputCooldown.laneChange) {
            if (tiltInput.x > 0.4 && this.currentLane < 2) {
                this.currentLane++;
                this.inputCooldown.laneChange = now + 300; // 300ms cooldown
            } else if (tiltInput.x < -0.4 && this.currentLane > 0) {
                this.currentLane--;
                this.inputCooldown.laneChange = now + 300;
            }
        }

        // Jump (tilt forward)
        if (now > this.inputCooldown.jump && tiltInput.y > 0.5 && !this.playerState.isJumping && !this.playerState.isSliding) {
            this.playerState.isJumping = true;
            this.playerState.jumpVelocity = 10;
            this.inputCooldown.jump = now + 1000; // 1s cooldown
        }

        // Slide (tilt backward)
        if (now > this.inputCooldown.slide && tiltInput.y < -0.5 && !this.playerState.isJumping && !this.playerState.isSliding) {
            this.playerState.isSliding = true;
            this.playerState.slideTimer = 1000; // Slide for 1s
            this.player.scale.y = 0.5; // Squash player
            this.player.position.y = 0.45;
            this.inputCooldown.slide = now + 1500; // 1.5s cooldown
        }
    }

    startGameLoop() {
        this.gameState.isPlaying = true;
        this.lastTime = performance.now();
        this.animate();
    }

    animate() {
        if (!this.gameState.isPlaying) return;

        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update player position and state
        this.updatePlayer(deltaTime);

        // Spawn new obstacles
        this.spawnObstacles(deltaTime);

        // Move obstacles and check for collisions
        this.updateObstacles(deltaTime);

        // Update score
        this.score += Math.floor(this.gameSpeed * 10);
        document.getElementById('score-display').innerText = `Score: ${this.score}`;

        this.renderer.render(this.scene, this.camera);
    }

    updatePlayer(deltaTime) {
        // Smoothly move player to the target lane
        const targetX = this.lanes[this.currentLane];
        this.player.position.x = THREE.MathUtils.lerp(this.player.position.x, targetX, 10 * deltaTime);

        // Player's forward movement
        this.player.position.z -= this.gameSpeed * 60 * deltaTime;
        this.camera.position.z = this.player.position.z + 10;

        // Jumping logic
        if (this.playerState.isJumping) {
            this.player.position.y += this.playerState.jumpVelocity * deltaTime;
            this.playerState.jumpVelocity -= 25 * deltaTime; // Gravity

            if (this.player.position.y <= 0.9) {
                this.player.position.y = 0.9;
                this.playerState.isJumping = false;
            }
        }

        // Sliding logic
        if (this.playerState.isSliding) {
            this.playerState.slideTimer -= deltaTime * 1000;
            if (this.playerState.slideTimer <= 0) {
                this.playerState.isSliding = false;
                this.player.scale.y = 1.0; // Unsquash
                this.player.position.y = 0.9;
            }
        }
    }

    spawnObstacles(deltaTime) {
        this.obstacleSpawnTimer -= deltaTime;
        if (this.obstacleSpawnTimer <= 0) {
            this.obstacleSpawnTimer = Math.random() * 1.5 + 0.8; // Spawn every 0.8-2.3 seconds

            const lane = Math.floor(Math.random() * 3);
            const type = Math.random() > 0.5 ? 'log' : 'saw';
            let obstacle;

            if (type === 'log') { // Slide under
                const geometry = new THREE.BoxGeometry(2, 1.5, 1);
                const material = new THREE.MeshStandardMaterial({ color: 0x966F33 });
                obstacle = new THREE.Mesh(geometry, material);
                obstacle.position.set(this.lanes[lane], 1.6, this.player.position.z - 100);
            } else { // Jump over
                const geometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
                const material = new THREE.MeshStandardMaterial({ color: 0x708090, metalness: 0.5 });
                obstacle = new THREE.Mesh(geometry, material);
                obstacle.position.set(this.lanes[lane], 0, this.player.position.z - 100);
                obstacle.rotation.x = Math.PI / 2;
            }
            
            obstacle.userData.type = type;
            obstacle.castShadow = true;
            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        }
    }

    updateObstacles(deltaTime) {
        const playerBox = new THREE.Box3().setFromObject(this.player);

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            // If obstacle is far behind, remove it
            if (obstacle.position.z > this.player.position.z + 20) {
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
                continue;
            }

            // Collision detection
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            if (playerBox.intersectsBox(obstacleBox)) {
                let hasCollided = false;
                if (obstacle.userData.type === 'log' && !this.playerState.isSliding) {
                    hasCollided = true;
                }
                if (obstacle.userData.type === 'saw' && !this.playerState.isJumping) {
                    hasCollided = true;
                }

                if (hasCollided) {
                    this.gameOver();
                    return;
                }
            }
        }
    }

    gameOver() {
        this.gameState.isPlaying = false;
        document.getElementById('finalScore').innerText = this.score;
        document.getElementById('gameOverScreen').style.display = 'block';
    }
}

document.getElementById('start-game-btn').addEventListener('click', () => {
    window.game = new TempleRunGame();
    window.game.init();
});

window.restartGame = function() {
    location.reload();
}

window.goToMain = function() {
    window.location.href = '../index.html';
}
