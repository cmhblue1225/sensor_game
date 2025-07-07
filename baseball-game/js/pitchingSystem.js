/**
 * 투구 시스템
 * 다양한 투구 타입과 타이밍으로 10개의 공을 던지는 시스템
 */

class PitchingSystem {
    constructor(ballPhysics) {
        this.ballPhysics = ballPhysics;
        
        // 투구 설정
        this.pitchCount = 0;
        this.maxPitches = 10;
        this.isActive = false;
        this.currentPitch = null;
        
        // 투수 위치 (배트 위치에 맞춰 조정)
        this.pitcherPosition = new THREE.Vector3(0, 4, 15);
        this.platePosition = new THREE.Vector3(-1, 4, -3); // 배트 위치와 동일하게
        
        // 투구 시나리오 (10가지 다른 투구)
        this.pitchScenarios = [
            { type: 'fastball', speed: 35, delay: 1000, accuracy: 0.9 },
            { type: 'curveball', speed: 25, delay: 1500, accuracy: 0.8 },
            { type: 'fastball', speed: 38, delay: 800, accuracy: 0.85 },
            { type: 'slider', speed: 30, delay: 1200, accuracy: 0.75 },
            { type: 'changeup', speed: 22, delay: 2000, accuracy: 0.9 },
            { type: 'fastball', speed: 40, delay: 600, accuracy: 0.8 },
            { type: 'curveball', speed: 28, delay: 1800, accuracy: 0.7 },
            { type: 'knuckleball', speed: 20, delay: 2500, accuracy: 0.6 },
            { type: 'slider', speed: 32, delay: 1000, accuracy: 0.85 },
            { type: 'fastball', speed: 42, delay: 500, accuracy: 0.9 }
        ];
        
        // 투구 상태
        this.pitchingState = 'ready'; // ready, winding, throwing, finished
        this.nextPitchTimer = null;
        this.isWaitingForNext = false;
        
        this.init();
    }
    
    /**
     * 투구 시스템 초기화
     */
    init() {
        this.setupEventListeners();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 게임 시작 이벤트
        document.addEventListener('gameStart', () => {
            this.startPitching();
        });
        
        // 게임 리셋 이벤트
        document.addEventListener('gameReset', () => {
            this.reset();
        });
        
        // 공이 경계를 벗어났을 때
        document.addEventListener('ballOut', () => {
            this.scheduleNextPitch();
        });
        
        // 공이 지면에 바운드했을 때
        document.addEventListener('ballBounce', () => {
            this.scheduleNextPitch();
        });
        
        // 타격이 발생했을 때
        document.addEventListener('ballHit', () => {
            this.scheduleNextPitch();
        });
    }
    
    /**
     * 투구 시작
     */
    startPitching() {
        if (this.isActive) {
            console.log('투구가 이미 진행 중입니다');
            return;
        }
        
        this.isActive = true;
        this.pitchCount = 0;
        this.pitchingState = 'ready';
        this.isWaitingForNext = false;
        
        console.log('투구 시작!');
        this.scheduleNextPitch();
    }
    
    /**
     * 다음 투구 예약
     */
    scheduleNextPitch() {
        if (!this.isActive || this.pitchCount >= this.maxPitches || this.isWaitingForNext) {
            if (this.pitchCount >= this.maxPitches) {
                this.finishPitching();
            }
            return;
        }
        
        this.isWaitingForNext = true;
        
        // 현재 투구 시나리오 가져오기
        const scenario = this.pitchScenarios[this.pitchCount];
        
        // 투구 정보 업데이트
        this.updatePitchUI(scenario);
        
        console.log(`다음 투구 예약: ${this.pitchCount + 1}/10 - ${scenario.type}`);
        
        // 지연 시간 후 투구 실행
        if (this.nextPitchTimer) {
            clearTimeout(this.nextPitchTimer);
        }
        
        this.nextPitchTimer = setTimeout(() => {
            this.executePitch(scenario);
        }, scenario.delay);
    }
    
    /**
     * 투구 실행
     */
    executePitch(scenario) {
        if (!this.isActive) return;
        
        this.pitchingState = 'throwing';
        this.pitchCount++;
        this.isWaitingForNext = false;
        
        // 투구 궤적 계산
        const trajectory = this.calculateTrajectory(scenario);
        
        // 공 생성 및 던지기
        const ball = this.ballPhysics.createBall(
            this.pitcherPosition.clone(),
            trajectory.velocity,
            scenario.type
        );
        
        this.currentPitch = {
            ball: ball,
            scenario: scenario,
            startTime: Date.now()
        };
        
        // 투구 이벤트 발생
        this.dispatchPitchEvent(ball, scenario);
        
        // UI 업데이트
        this.updateGameUI();
        
        console.log(`투구 ${this.pitchCount}: ${scenario.type} (${scenario.speed}mph)`);
        
        // 3초 후 자동으로 다음 투구 (공이 사라지지 않는 경우 대비)
        setTimeout(() => {
            if (this.pitchCount < this.maxPitches && !this.isWaitingForNext) {
                this.scheduleNextPitch();
            }
        }, 3000);
    }
    
    /**
     * 투구 궤적 계산
     */
    calculateTrajectory(scenario) {
        // 기본 방향 (투수 → 홈플레이트)
        const direction = new THREE.Vector3();
        direction.subVectors(this.platePosition, this.pitcherPosition);
        direction.normalize();
        
        // 정확도에 따른 무작위 편차
        const accuracy = scenario.accuracy;
        const deviation = (1 - accuracy) * 2; // 최대 편차
        
        direction.x += (Math.random() - 0.5) * deviation;
        direction.y += (Math.random() - 0.5) * deviation * 0.5; // 수직 편차는 적게
        direction.z += (Math.random() - 0.5) * deviation * 0.3;
        
        direction.normalize();
        
        // 속도 적용
        const velocity = direction.multiplyScalar(scenario.speed);
        
        // 투구 타입에 따른 추가 효과
        this.applyPitchTypeEffect(velocity, scenario.type);
        
        return { velocity, direction };
    }
    
    /**
     * 투구 타입별 효과 적용
     */
    applyPitchTypeEffect(velocity, pitchType) {
        switch (pitchType) {
            case 'fastball':
                // 직구: 약간의 상승 효과
                velocity.y += 1;
                break;
                
            case 'curveball':
                // 커브볼: 하강 효과
                velocity.y -= 3;
                velocity.x += (Math.random() - 0.5) * 4;
                break;
                
            case 'slider':
                // 슬라이더: 측면 변화
                velocity.x += (Math.random() - 0.5) * 6;
                velocity.y -= 1;
                break;
                
            case 'changeup':
                // 체인지업: 속도 감소, 하강
                velocity.multiplyScalar(0.8);
                velocity.y -= 2;
                break;
                
            case 'knuckleball':
                // 너클볼: 불규칙한 변화
                velocity.x += (Math.random() - 0.5) * 8;
                velocity.y += (Math.random() - 0.5) * 4;
                velocity.z += (Math.random() - 0.5) * 3;
                break;
        }
    }
    
    /**
     * 투구 정보 UI 업데이트
     */
    updatePitchUI(scenario) {
        const pitchInfo = document.getElementById('pitchInfo');
        if (pitchInfo) {
            const nextPitchNum = this.pitchCount + 1;
            pitchInfo.innerHTML = `
                다음 투구 ${nextPitchNum}/10<br>
                <span style="color: #FFC107">${this.getPitchTypeName(scenario.type)}</span><br>
                <span style="font-size: 12px">${scenario.speed}mph • ${(scenario.delay/1000).toFixed(1)}초 후</span>
            `;
        }
    }
    
    /**
     * 게임 UI 업데이트
     */
    updateGameUI() {
        // 투구 수 업데이트
        const pitchCount = document.getElementById('pitchCount');
        if (pitchCount) {
            pitchCount.textContent = `${this.pitchCount}/${this.maxPitches}`;
        }
        
        // 투구 정보 업데이트
        const pitchInfo = document.getElementById('pitchInfo');
        if (pitchInfo && this.currentPitch) {
            const scenario = this.currentPitch.scenario;
            pitchInfo.innerHTML = `
                투구 중!<br>
                <span style="color: #4CAF50">${this.getPitchTypeName(scenario.type)}</span><br>
                <span style="font-size: 12px">스윙 타이밍을 맞춰보세요!</span>
            `;
        }
    }
    
    /**
     * 투구 타입 한글명 반환
     */
    getPitchTypeName(pitchType) {
        const names = {
            'fastball': '직구',
            'curveball': '커브볼',
            'slider': '슬라이더',
            'changeup': '체인지업',
            'knuckleball': '너클볼'
        };
        
        return names[pitchType] || pitchType;
    }
    
    /**
     * 투구 완료
     */
    finishPitching() {
        this.isActive = false;
        this.pitchingState = 'finished';
        
        // 게임 종료 이벤트 발생
        const gameEndEvent = new CustomEvent('gameEnd', {
            detail: {
                totalPitches: this.pitchCount,
                scenarios: this.pitchScenarios
            }
        });
        
        document.dispatchEvent(gameEndEvent);
        
        // UI 업데이트
        const pitchInfo = document.getElementById('pitchInfo');
        if (pitchInfo) {
            pitchInfo.innerHTML = `
                게임 종료!<br>
                <span style="color: #4CAF50">10투구 완료</span><br>
                <span style="font-size: 12px">결과를 확인하세요</span>
            `;
        }
        
        console.log('투구 완료!');
    }
    
    /**
     * 투구 이벤트 발생
     */
    dispatchPitchEvent(ball, scenario) {
        const pitchEvent = new CustomEvent('pitchThrown', {
            detail: {
                ball: ball,
                scenario: scenario,
                pitchNumber: this.pitchCount,
                totalPitches: this.maxPitches
            }
        });
        
        document.dispatchEvent(pitchEvent);
    }
    
    /**
     * 현재 투구 정보 반환
     */
    getCurrentPitch() {
        return this.currentPitch;
    }
    
    /**
     * 투구 수 반환
     */
    getPitchCount() {
        return this.pitchCount;
    }
    
    /**
     * 남은 투구 수 반환
     */
    getRemainingPitches() {
        return this.maxPitches - this.pitchCount;
    }
    
    /**
     * 투구 활성 상태 확인
     */
    isActivePitching() {
        return this.isActive;
    }
    
    /**
     * 특정 투구 시나리오 가져오기
     */
    getPitchScenario(index) {
        return this.pitchScenarios[index] || null;
    }
    
    /**
     * 리셋
     */
    reset() {
        this.isActive = false;
        this.pitchCount = 0;
        this.pitchingState = 'ready';
        this.currentPitch = null;
        this.isWaitingForNext = false;
        
        // 타이머 정리
        if (this.nextPitchTimer) {
            clearTimeout(this.nextPitchTimer);
            this.nextPitchTimer = null;
        }
        
        // 모든 공 제거
        this.ballPhysics.clearAllBalls();
        
        // UI 리셋
        const pitchInfo = document.getElementById('pitchInfo');
        if (pitchInfo) {
            pitchInfo.textContent = '게임 시작을 기다리는 중...';
        }
        
        const pitchCount = document.getElementById('pitchCount');
        if (pitchCount) {
            pitchCount.textContent = '0/10';
        }
        
        console.log('투구 시스템 리셋');
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        this.reset();
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.PitchingSystem = PitchingSystem;
}