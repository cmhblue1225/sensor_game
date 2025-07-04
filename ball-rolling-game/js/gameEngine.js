/**
 * 2D 볼 굴리기 게임 엔진
 * 캔버스 렌더링 및 게임 루프 관리
 */
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // 렌더링 설정
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // 배경 그라디언트
        this.backgroundGradient = this.createBackgroundGradient();
        
        // 애니메이션 프레임
        this.animationFrame = null;
        this.lastTime = 0;
        
        // 카메라 (향후 확장용)
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
    }
    
    /**
     * 배경 그라디언트 생성
     */
    createBackgroundGradient() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#2c3e50');
        return gradient;
    }
    
    /**
     * 캔버스 지우기 및 배경 그리기
     */
    clear() {
        this.ctx.fillStyle = this.backgroundGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 격자 패턴 그리기
        this.drawGrid();
    }
    
    /**
     * 격자 패턴 그리기
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        // 수직선
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // 수평선
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * 공 그리기
     */
    drawBall(ball) {
        // 공 데이터 유효성 검사
        if (!ball || typeof ball.x !== 'number' || typeof ball.y !== 'number' || 
            typeof ball.radius !== 'number' || !isFinite(ball.x) || 
            !isFinite(ball.y) || !isFinite(ball.radius) || ball.radius <= 0) {
            console.warn('공 데이터가 유효하지 않습니다:', ball);
            return;
        }
        
        // 궤적 그리기
        this.drawTrail(ball.trail);
        
        // 공 그림자
        this.drawBallShadow(ball);
        
        // 공 본체
        this.ctx.save();
        
        // 공 그라디언트
        const gradient = this.ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.4, ball.color);
        gradient.addColorStop(1, this.darkenColor(ball.color, 0.3));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 공 테두리
        this.ctx.strokeStyle = this.darkenColor(ball.color, 0.5);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 하이라이트
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            ball.x - ball.radius * 0.3, 
            ball.y - ball.radius * 0.3, 
            ball.radius * 0.3, 
            0, Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 공 그림자 그리기
     */
    drawBallShadow(ball) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.ellipse(
            ball.x + 3, ball.y + 3, 
            ball.radius * 0.8, ball.radius * 0.6, 
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.restore();
    }
    
    /**
     * 궤적 그리기
     */
    drawTrail(trail) {
        if (trail.length < 2) return;
        
        this.ctx.save();
        
        for (let i = 1; i < trail.length; i++) {
            const point = trail[i];
            const prevPoint = trail[i - 1];
            
            this.ctx.globalAlpha = point.alpha * 0.5;
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = (point.alpha * 8) + 1;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(prevPoint.x, prevPoint.y);
            this.ctx.lineTo(point.x, point.y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 장애물 그리기
     */
    drawObstacles(obstacles) {
        for (const obstacle of obstacles) {
            this.ctx.save();
            
            // 장애물 그라디언트
            const gradient = this.ctx.createLinearGradient(
                obstacle.x, obstacle.y,
                obstacle.x, obstacle.y + obstacle.height
            );
            gradient.addColorStop(0, '#e74c3c');
            gradient.addColorStop(1, '#c0392b');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 테두리
            this.ctx.strokeStyle = '#a93226';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 하이라이트
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 5);
            
            this.ctx.restore();
        }
    }
    
    /**
     * 목표 그리기
     */
    drawGoals(goals) {
        const time = Date.now() * 0.01;
        
        for (const goal of goals) {
            this.ctx.save();
            
            // 목표 애니메이션 효과
            const pulse = 1 + Math.sin(time + goal.x * 0.01) * 0.1;
            const radius = goal.radius * pulse;
            
            // 목표 그라디언트
            const gradient = this.ctx.createRadialGradient(
                goal.x, goal.y, 0,
                goal.x, goal.y, radius
            );
            gradient.addColorStop(0, '#f1c40f');
            gradient.addColorStop(0.7, '#f39c12');
            gradient.addColorStop(1, '#e67e22');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(goal.x, goal.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 목표 테두리
            this.ctx.strokeStyle = '#d68910';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 목표 아이콘 (별)
            this.drawStar(goal.x, goal.y, radius * 0.6, '#ffffff');
            
            this.ctx.restore();
        }
    }
    
    /**
     * 구멍 그리기
     */
    drawHoles(holes) {
        for (const hole of holes) {
            this.ctx.save();
            
            // 구멍 그라디언트 (어두운 원)
            const gradient = this.ctx.createRadialGradient(
                hole.x, hole.y, 0,
                hole.x, hole.y, hole.radius
            );
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(0.7, '#2c3e50');
            gradient.addColorStop(1, '#34495e');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 구멍 테두리
            this.ctx.strokeStyle = '#1a252f';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    /**
     * 파티클 그리기
     */
    drawParticles(particles) {
        this.ctx.save();
        
        for (const particle of particles) {
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 별 그리기
     */
    drawStar(x, y, radius, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = this.darkenColor(color, 0.3);
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const r = i % 2 === 0 ? radius : radius * 0.5;
            const px = x + Math.cos(angle - Math.PI / 2) * r;
            const py = y + Math.sin(angle - Math.PI / 2) * r;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * 레벨 완료 효과
     */
    drawLevelCompleteEffect() {
        const time = Date.now() * 0.005;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        
        // 반짝이는 효과
        for (let i = 0; i < 20; i++) {
            const x = (Math.sin(time + i) * 0.5 + 0.5) * this.width;
            const y = (Math.cos(time * 1.3 + i * 1.7) * 0.5 + 0.5) * this.height;
            const size = Math.sin(time * 2 + i) * 3 + 5;
            
            this.ctx.fillStyle = `hsl(${(time * 50 + i * 30) % 360}, 100%, 70%)`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, Math.abs(size), 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 색상 어둡게 만들기
     */
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.floor(r * (1 - factor));
        const newG = Math.floor(g * (1 - factor));
        const newB = Math.floor(b * (1 - factor));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    /**
     * 화면 크기 조정
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
        this.backgroundGradient = this.createBackgroundGradient();
    }
    
    /**
     * 전체 게임 렌더링
     */
    render(gameState) {
        this.clear();
        
        if (gameState.obstacles) this.drawObstacles(gameState.obstacles);
        if (gameState.holes) this.drawHoles(gameState.holes);
        if (gameState.goals) this.drawGoals(gameState.goals);
        if (gameState.ball) this.drawBall(gameState.ball);
        if (gameState.particles) this.drawParticles(gameState.particles);
        
        if (gameState.levelComplete) {
            this.drawLevelCompleteEffect();
        }
    }
}