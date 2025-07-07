/**
 * 이펙트 매니저 클래스
 * 시각 효과 및 파티클 시스템 관리
 */
class EffectsManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.effects = [];
        
        // 이펙트 설정
        this.settings = {
            maxParticles: 200,
            particleLifespan: 2000, // 2초
            explosionParticles: 30,
            trailLength: 10
        };
        
        this.isRunning = false;
        this.animationId = null;
        
        this.init();
    }
    
    /**
     * 이펙트 매니저 초기화
     */
    init() {
        this.setupCanvas();
        this.start();
        
        console.log('이펙트 매니저 초기화 완료');
    }
    
    /**
     * 캔버스 설정
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }
    }
    
    /**
     * 이펙트 시스템 시작
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
    }
    
    /**
     * 이펙트 시스템 정지
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * 애니메이션 루프
     */
    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    /**
     * 이펙트 업데이트
     */
    update() {
        const currentTime = Date.now();
        
        // 파티클 업데이트
        this.particles = this.particles.filter(particle => {
            this.updateParticle(particle, currentTime);
            return particle.life > 0;
        });
        
        // 이펙트 업데이트
        this.effects = this.effects.filter(effect => {
            this.updateEffect(effect, currentTime);
            return !effect.finished;
        });
    }
    
    /**
     * 파티클 업데이트
     */
    updateParticle(particle, currentTime) {
        const deltaTime = currentTime - particle.lastUpdate;
        particle.lastUpdate = currentTime;
        
        // 위치 업데이트
        particle.x += particle.vx * deltaTime * 0.001;
        particle.y += particle.vy * deltaTime * 0.001;
        
        // 속도 감쇠
        particle.vx *= particle.friction;
        particle.vy *= particle.friction;
        
        // 중력 적용
        if (particle.gravity) {
            particle.vy += particle.gravity * deltaTime * 0.001;
        }
        
        // 생명력 감소
        particle.life -= deltaTime;
        
        // 알파값 계산
        particle.alpha = Math.max(0, particle.life / particle.maxLife);
        
        // 크기 변화
        if (particle.scaleChange) {
            particle.scale += particle.scaleChange * deltaTime * 0.001;
            particle.scale = Math.max(0, particle.scale);
        }
    }
    
    /**
     * 이펙트 업데이트
     */
    updateEffect(effect, currentTime) {
        const elapsed = currentTime - effect.startTime;
        const progress = Math.min(elapsed / effect.duration, 1);
        
        effect.progress = progress;
        
        if (progress >= 1) {
            effect.finished = true;
        }
        
        // 이펙트 타입별 업데이트
        switch (effect.type) {
            case 'ripple':
                this.updateRippleEffect(effect, progress);
                break;
            case 'flash':
                this.updateFlashEffect(effect, progress);
                break;
            case 'shake':
                this.updateShakeEffect(effect, progress);
                break;
        }
    }
    
    /**
     * 리플 이펙트 업데이트
     */
    updateRippleEffect(effect, progress) {
        effect.radius = effect.maxRadius * progress;
        effect.alpha = 1 - progress;
    }
    
    /**
     * 플래시 이펙트 업데이트
     */
    updateFlashEffect(effect, progress) {
        if (progress < 0.2) {
            effect.alpha = progress / 0.2;
        } else {
            effect.alpha = 1 - ((progress - 0.2) / 0.8);
        }
    }
    
    /**
     * 쉐이크 이펙트 업데이트
     */
    updateShakeEffect(effect, progress) {
        const intensity = effect.intensity * (1 - progress);
        effect.offsetX = (Math.random() - 0.5) * intensity;
        effect.offsetY = (Math.random() - 0.5) * intensity;
    }
    
    /**
     * 이펙트 렌더링
     */
    render() {
        if (!this.ctx) return;
        
        // 파티클 렌더링
        this.particles.forEach(particle => {
            this.renderParticle(particle);
        });
        
        // 이펙트 렌더링
        this.effects.forEach(effect => {
            this.renderEffect(effect);
        });
    }
    
    /**
     * 파티클 렌더링
     */
    renderParticle(particle) {
        this.ctx.save();
        
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.translate(particle.x, particle.y);
        this.ctx.scale(particle.scale, particle.scale);
        
        // 파티클 타입별 렌더링
        switch (particle.type) {
            case 'circle':
                this.renderCircleParticle(particle);
                break;
            case 'star':
                this.renderStarParticle(particle);
                break;
            case 'spark':
                this.renderSparkParticle(particle);
                break;
            case 'note':
                this.renderNoteParticle(particle);
                break;
        }
        
        this.ctx.restore();
    }
    
    /**
     * 원형 파티클 렌더링
     */
    renderCircleParticle(particle) {
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 글로우 효과
        if (particle.glow) {
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = particle.size * 2;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
    
    /**
     * 별 파티클 렌더링
     */
    renderStarParticle(particle) {
        const spikes = 5;
        const outerRadius = particle.size;
        const innerRadius = particle.size * 0.5;
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * 스파크 파티클 렌더링
     */
    renderSparkParticle(particle) {
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = particle.size;
        this.ctx.lineCap = 'round';
        
        const length = particle.size * 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-length / 2, 0);
        this.ctx.lineTo(length / 2, 0);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -length / 2);
        this.ctx.lineTo(0, length / 2);
        this.ctx.stroke();
    }
    
    /**
     * 노트 파티클 렌더링
     */
    renderNoteParticle(particle) {
        // 음표 모양 (♪)
        this.ctx.fillStyle = particle.color;
        this.ctx.font = `${particle.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('♪', 0, 0);
    }
    
    /**
     * 이펙트 렌더링
     */
    renderEffect(effect) {
        switch (effect.type) {
            case 'ripple':
                this.renderRippleEffect(effect);
                break;
            case 'flash':
                this.renderFlashEffect(effect);
                break;
        }
    }
    
    /**
     * 리플 이펙트 렌더링
     */
    renderRippleEffect(effect) {
        this.ctx.save();
        this.ctx.globalAlpha = effect.alpha;
        this.ctx.strokeStyle = effect.color;
        this.ctx.lineWidth = effect.lineWidth || 3;
        
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * 플래시 이펙트 렌더링
     */
    renderFlashEffect(effect) {
        this.ctx.save();
        this.ctx.globalAlpha = effect.alpha;
        this.ctx.fillStyle = effect.color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    /**
     * 판정 이펙트 재생
     */
    playJudgmentEffect(judgmentType, timing) {
        const hitZone = document.getElementById('hitZone');
        if (!hitZone) return;
        
        const rect = hitZone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 화면 좌표를 캔버스 좌표로 변환
        const canvasX = centerX;
        const canvasY = centerY;
        
        switch (judgmentType) {
            case 'perfect':
                this.createPerfectEffect(canvasX, canvasY);
                break;
            case 'good':
                this.createGoodEffect(canvasX, canvasY);
                break;
            case 'miss':
                this.createMissEffect(canvasX, canvasY);
                break;
        }
    }
    
    /**
     * Perfect 이펙트 생성
     */
    createPerfectEffect(x, y) {
        // 골든 파티클 폭발
        for (let i = 0; i < 20; i++) {
            this.createParticle({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                size: 3 + Math.random() * 4,
                color: `hsl(${45 + Math.random() * 30}, 100%, 70%)`,
                type: 'star',
                life: 1500,
                gravity: 50,
                friction: 0.98,
                glow: true
            });
        }
        
        // 리플 효과
        this.createEffect({
            type: 'ripple',
            x: x,
            y: y,
            maxRadius: 100,
            color: '#FFD700',
            duration: 800,
            lineWidth: 4
        });
        
        // 플래시 효과
        this.createEffect({
            type: 'flash',
            color: 'rgba(255, 215, 0, 0.3)',
            duration: 200
        });
    }
    
    /**
     * Good 이펙트 생성
     */
    createGoodEffect(x, y) {
        // 청록색 파티클
        for (let i = 0; i < 12; i++) {
            this.createParticle({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: 2 + Math.random() * 3,
                color: `hsl(${170 + Math.random() * 20}, 80%, 60%)`,
                type: 'circle',
                life: 1200,
                gravity: 30,
                friction: 0.99
            });
        }
        
        // 리플 효과
        this.createEffect({
            type: 'ripple',
            x: x,
            y: y,
            maxRadius: 70,
            color: '#4ecdc4',
            duration: 600,
            lineWidth: 3
        });
    }
    
    /**
     * Miss 이펙트 생성
     */
    createMissEffect(x, y) {
        // 빨간색 파티클 (적은 양)
        for (let i = 0; i < 8; i++) {
            this.createParticle({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                size: 1 + Math.random() * 2,
                color: `hsl(${0 + Math.random() * 20}, 80%, 60%)`,
                type: 'spark',
                life: 800,
                gravity: 20,
                friction: 0.97
            });
        }
        
        // 쉐이크 효과
        this.createEffect({
            type: 'shake',
            intensity: 10,
            duration: 200
        });
    }
    
    /**
     * 파티클 생성
     */
    createParticle(options) {
        // 최대 파티클 수 제한
        if (this.particles.length >= this.settings.maxParticles) {
            this.particles.shift(); // 가장 오래된 파티클 제거
        }
        
        const particle = {
            x: options.x || 0,
            y: options.y || 0,
            vx: options.vx || 0,
            vy: options.vy || 0,
            size: options.size || 2,
            color: options.color || '#ffffff',
            type: options.type || 'circle',
            life: options.life || 1000,
            maxLife: options.life || 1000,
            alpha: 1,
            scale: options.scale || 1,
            scaleChange: options.scaleChange || 0,
            gravity: options.gravity || 0,
            friction: options.friction || 1,
            glow: options.glow || false,
            lastUpdate: Date.now()
        };
        
        this.particles.push(particle);
    }
    
    /**
     * 이펙트 생성
     */
    createEffect(options) {
        const effect = {
            type: options.type,
            x: options.x || 0,
            y: options.y || 0,
            color: options.color || '#ffffff',
            duration: options.duration || 1000,
            startTime: Date.now(),
            progress: 0,
            finished: false,
            alpha: 1,
            ...options
        };
        
        this.effects.push(effect);
    }
    
    /**
     * 콤보 이펙트
     */
    createComboEffect(combo, x, y) {
        if (combo < 5) return; // 5콤보 이상부터 표시
        
        const intensity = Math.min(combo / 50, 1); // 50콤보에서 최대
        
        // 콤보 파티클
        const particleCount = Math.min(5 + Math.floor(combo / 5), 30);
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200 * intensity,
                vy: (Math.random() - 0.5) * 200 * intensity,
                size: 2 + Math.random() * 3 * intensity,
                color: `hsl(${280 + Math.random() * 40}, 80%, 70%)`,
                type: 'note',
                life: 1000 + intensity * 1000,
                gravity: 20,
                friction: 0.98
            });
        }
    }
    
    /**
     * 스테이지 클리어 이펙트
     */
    createStageClearEffect() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 대량의 골든 파티클
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                this.createParticle({
                    x: centerX + (Math.random() - 0.5) * this.canvas.width,
                    y: centerY + (Math.random() - 0.5) * this.canvas.height,
                    vx: (Math.random() - 0.5) * 400,
                    vy: -Math.random() * 300 - 100,
                    size: 4 + Math.random() * 6,
                    color: `hsl(${45 + Math.random() * 30}, 100%, 70%)`,
                    type: Math.random() < 0.5 ? 'star' : 'circle',
                    life: 3000,
                    gravity: 80,
                    friction: 0.95,
                    glow: true
                });
            }, i * 30);
        }
        
        // 연속 플래시
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createEffect({
                    type: 'flash',
                    color: `rgba(255, 215, 0, ${0.2 - i * 0.03})`,
                    duration: 300
                });
            }, i * 200);
        }
    }
    
    /**
     * 모든 이펙트 클리어
     */
    clearAllEffects() {
        this.particles = [];
        this.effects = [];
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        this.stop();
        this.clearAllEffects();
        console.log('이펙트 매니저 리소스 정리 완료');
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.EffectsManager = EffectsManager;
}