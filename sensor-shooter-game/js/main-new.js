/**
 * Sensor Shooter Game - 완전 새로운 버전
 * 2D Canvas 기반 슈팅 게임
 */

class SensorShooterGame {
    constructor() {
        console.log('🎯 NEW SensorShooterGame 생성자 시작');
        
        try {
            // Canvas 엘리먼트 직접 가져오기
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('게임 캔버스를 찾을 수 없습니다');
            }
            
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = 800;
            this.canvas.height = 600;
            
            // 게임 상태
            this.gameStarted = false;
            this.gameFinished = false;
            this.score = 0;
            this.health = 100;
            
            // 게임 객체들
            this.playerTurret = {
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                radius: 30,
                aimX: this.canvas.width / 2,
                aimY: this.canvas.height / 2,
                angle: 0
            };
            
            this.enemies = [];
            this.projectiles = [];
            
            // 타이머들
            this.lastTime = 0;
            this.enemySpawnTimer = 0;
            this.enemySpawnInterval = 2000; // 2초마다 적 생성
            this.autoShootTimer = 0;
            this.autoShootInterval = 300; // 0.3초마다 자동 발사
            
            // 센서 데이터
            this.sensorData = {
                connected: false,
                tilt: { x: 0, y: 0 }
            };
            
            console.log('✅ 모든 컴포넌트 생성 완료');
            this.init();
        } catch (error) {
            console.error('❌ SensorShooterGame 생성자 오류:', error);
            throw error;
        }
    }
    
    init() {
        console.log('🎯 게임 초기화 시작');
        
        // 센서 연결 시도
        this.connectToSensor();
        
        // 키보드 이벤트 (시뮬레이션용)
        this.setupKeyboardControls();
        
        // 로딩 화면 숨기고 카운트다운 시작
        document.getElementById('loadingScreen').style.display = 'none';
        this.startCountdown();
        
        console.log('✅ 게임 초기화 완료');
    }
    
    connectToSensor() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const port = window.location.protocol === 'https:' ? '8443' : '8080';
            const wsUrl = `${protocol}//${window.location.hostname}:${port}`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('센서 WebSocket 연결됨');
                this.sensorData.connected = true;
                this.updateSensorUI();
                
                // 게임 클라이언트로 등록
                this.ws.send(JSON.stringify({
                    type: 'game_client_register',
                    deviceId: 'Shooter-Game-' + Math.random().toString(36).substr(2, 9),
                    timestamp: Date.now()
                }));
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'sensor_data') {
                        const orientation = data.data?.orientation;
                        if (orientation) {
                            // 조준 처리 (감도 조정)
                            this.sensorData.tilt.x = (orientation.gamma || 0) * 0.05;
                            this.sensorData.tilt.y = (orientation.beta || 0) * 0.05;
                        }
                        this.updateSensorUI();
                    }
                } catch (error) {
                    console.error('센서 데이터 파싱 오류:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('센서 WebSocket 연결 끊어짐');
                this.sensorData.connected = false;
                this.updateSensorUI();
                
                // 재연결 시도
                setTimeout(() => this.connectToSensor(), 3000);
            };
            
        } catch (error) {
            console.error('센서 연결 실패:', error);
            this.sensorData.connected = false;
            this.updateSensorUI();
        }
    }
    
    setupKeyboardControls() {
        // 마우스로 조준 (시뮬레이션)
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.playerTurret.aimX = e.clientX - rect.left;
            this.playerTurret.aimY = e.clientY - rect.top;
        });
    }
    
    startCountdown() {
        let countdown = 3;
        const countdownScreen = document.getElementById('countdownScreen');
        const countdownNumber = document.getElementById('countdownNumber');
        
        countdownScreen.style.display = 'flex';
        countdownNumber.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownNumber.textContent = countdown;
            } else if (countdown === 0) {
                countdownNumber.textContent = 'GO!';
            } else {
                clearInterval(countdownInterval);
                countdownScreen.style.display = 'none';
                this.gameStarted = true;
                this.startGameLoop();
                console.log('🎯 게임 시작!');
            }
        }, 1000);
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            if (this.gameFinished) return;
            
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    update(deltaTime) {
        if (!this.gameStarted || this.gameFinished) return;
        
        // 플레이어 조준 업데이트
        this.updatePlayerAim();
        
        // 자동 발사
        this.autoShootTimer += deltaTime;
        if (this.autoShootTimer >= this.autoShootInterval) {
            this.shoot();
            this.autoShootTimer = 0;
        }
        
        // 적 생성
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // 적 업데이트
        this.updateEnemies(deltaTime);
        
        // 투사체 업데이트
        this.updateProjectiles(deltaTime);
        
        // 충돌 감지
        this.checkCollisions();
        
        // UI 업데이트
        this.updateUI();
        
        // 게임 오버 체크
        if (this.health <= 0) {
            this.gameOver();
        }
    }
    
    updatePlayerAim() {
        // 센서 데이터 적용
        if (this.sensorData.connected) {
            this.playerTurret.aimX = this.playerTurret.x + this.sensorData.tilt.x * 200;
            this.playerTurret.aimY = this.playerTurret.y + this.sensorData.tilt.y * 200;
        }
        
        // 조준 각도 계산
        const dx = this.playerTurret.aimX - this.playerTurret.x;
        const dy = this.playerTurret.aimY - this.playerTurret.y;
        this.playerTurret.angle = Math.atan2(dy, dx);
    }
    
    shoot() {
        const speed = 500;
        const projectile = {
            x: this.playerTurret.x,
            y: this.playerTurret.y,
            dx: Math.cos(this.playerTurret.angle) * speed,
            dy: Math.sin(this.playerTurret.angle) * speed,
            radius: 5,
            color: 'yellow',
            alive: true
        };
        
        this.projectiles.push(projectile);
    }
    
    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        const radius = 15 + Math.random() * 15;
        
        switch (side) {
            case 0: // 위
                x = Math.random() * this.canvas.width;
                y = -radius;
                break;
            case 1: // 오른쪽
                x = this.canvas.width + radius;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // 아래
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + radius;
                break;
            case 3: // 왼쪽
                x = -radius;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        // 플레이어를 향하는 방향 계산
        const angle = Math.atan2(this.playerTurret.y - y, this.playerTurret.x - x);
        const speed = 50 + Math.random() * 50;
        
        const enemy = {
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            radius: radius,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            health: 3,
            alive: true
        };
        
        this.enemies.push(enemy);
    }
    
    updateEnemies(deltaTime) {
        const dt = deltaTime / 1000; // 초 단위로 변환
        
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            enemy.x += enemy.dx * dt;
            enemy.y += enemy.dy * dt;
            
            // 플레이어에 도달했는지 확인
            const dist = Math.sqrt(
                Math.pow(enemy.x - this.playerTurret.x, 2) + 
                Math.pow(enemy.y - this.playerTurret.y, 2)
            );
            
            if (dist < this.playerTurret.radius + enemy.radius) {
                this.health -= 10;
                enemy.alive = false;
            }
        });
        
        // 죽은 적 제거
        this.enemies = this.enemies.filter(enemy => enemy.alive);
    }
    
    updateProjectiles(deltaTime) {
        const dt = deltaTime / 1000;
        
        this.projectiles.forEach(projectile => {
            if (!projectile.alive) return;
            
            projectile.x += projectile.dx * dt;
            projectile.y += projectile.dy * dt;
            
            // 화면 밖으로 나가면 제거
            if (projectile.x < 0 || projectile.x > this.canvas.width ||
                projectile.y < 0 || projectile.y > this.canvas.height) {
                projectile.alive = false;
            }
        });
        
        // 죽은 투사체 제거
        this.projectiles = this.projectiles.filter(projectile => projectile.alive);
    }
    
    checkCollisions() {
        this.projectiles.forEach(projectile => {
            if (!projectile.alive) return;
            
            this.enemies.forEach(enemy => {
                if (!enemy.alive) return;
                
                const dist = Math.sqrt(
                    Math.pow(projectile.x - enemy.x, 2) + 
                    Math.pow(projectile.y - enemy.y, 2)
                );
                
                if (dist < projectile.radius + enemy.radius) {
                    projectile.alive = false;
                    enemy.health--;
                    
                    if (enemy.health <= 0) {
                        enemy.alive = false;
                        this.score += 10;
                    }
                }
            });
        });
    }
    
    render() {
        // 화면 지우기
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 플레이어 포탑 그리기
        this.drawPlayerTurret();
        
        // 적들 그리기
        this.enemies.forEach(enemy => {
            if (enemy.alive) {
                this.ctx.fillStyle = enemy.color;
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // 투사체들 그리기
        this.projectiles.forEach(projectile => {
            if (projectile.alive) {
                this.ctx.fillStyle = projectile.color;
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawPlayerTurret() {
        const ctx = this.ctx;
        
        // 포탑 베이스
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.playerTurret.x, this.playerTurret.y, this.playerTurret.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 포탑 배럴
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.playerTurret.x, this.playerTurret.y);
        ctx.lineTo(
            this.playerTurret.x + Math.cos(this.playerTurret.angle) * 40,
            this.playerTurret.y + Math.sin(this.playerTurret.angle) * 40
        );
        ctx.stroke();
    }
    
    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('healthDisplay').textContent = this.health;
    }
    
    updateSensorUI() {
        const status = this.sensorData.connected ? '📡 센서 연결됨' : '📡 센서 연결 대기중...';
        document.getElementById('sensorConnection').textContent = status;
        document.getElementById('aimX').textContent = this.sensorData.tilt.x.toFixed(2);
        document.getElementById('aimY').textContent = this.sensorData.tilt.y.toFixed(2);
        document.getElementById('accelMag').textContent = '0.00';
    }
    
    gameOver() {
        this.gameFinished = true;
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalScore').textContent = this.score;
        console.log('🎯 게임 오버! 최종 점수:', this.score);
    }
}

// 전역 함수들
function restartGame() {
    location.reload();
}

function goToMain() {
    window.location.href = '/';
}

// 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 NEW 센서 슈터 게임 DOM 로드 완료');
    
    try {
        window.sensorShooterGame = new SensorShooterGame();
        console.log('✅ NEW 센서 슈터 게임 초기화 성공!');
    } catch (error) {
        console.error('❌ NEW 게임 초기화 실패:', error);
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = 
                `<h1>🚫 게임 초기화 실패</h1><p>오류: ${error.message}</p>`;
        }
    }
});