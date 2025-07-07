/**
 * 점수 시스템
 * 타격 성과에 따른 점수 계산 및 통계 관리
 */

class ScoringSystem {
    constructor() {
        // 점수 데이터
        this.totalScore = 0;
        this.hitCount = 0;
        this.missCount = 0;
        this.strikeCount = 0;
        this.consecutiveHits = 0;
        this.bestStreak = 0;
        
        // 타격 기록
        this.hitHistory = [];
        this.pitchResults = [];
        
        // 점수 계산 기준
        this.scoreValues = {
            hit: {
                perfect: 1000,
                good: 700,
                fair: 400,
                poor: 200
            },
            timing: {
                perfect: 1.5,
                good: 1.2,
                late: 0.8
            },
            power: {
                homerun: 2.0,
                strong: 1.5,
                medium: 1.0,
                weak: 0.7
            },
            streak: {
                multiplier: 0.1, // 연속타격당 10% 보너스
                maxMultiplier: 2.0
            }
        };
        
        // 등급 기준
        this.gradeThresholds = {
            S: 8000,
            A: 6000,
            B: 4000,
            C: 2000,
            D: 0
        };
        
        this.init();
    }
    
    /**
     * 점수 시스템 초기화
     */
    init() {
        this.setupEventListeners();
        this.updateUI();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 타격 성공 이벤트
        document.addEventListener('baseballHit', (event) => {
            this.handleHit(event.detail);
        });
        
        // 스윙 미스 이벤트
        document.addEventListener('swingAndMiss', (event) => {
            this.handleMiss(event.detail);
        });
        
        // 스트라이크 이벤트
        document.addEventListener('strike', (event) => {
            this.handleStrike(event.detail);
        });
        
        // 게임 종료 이벤트
        document.addEventListener('gameEnd', () => {
            this.finishGame();
        });
        
        // 게임 리셋 이벤트
        document.addEventListener('gameReset', () => {
            this.reset();
        });
    }
    
    /**
     * 타격 성공 처리
     */
    handleHit(hitDetail) {
        const { hitData, timing, ball } = hitDetail;
        
        // 기본 점수 계산
        let baseScore = this.scoreValues.hit[hitData.contact] || this.scoreValues.hit.fair;
        
        // 타이밍 보너스
        const timingMultiplier = this.scoreValues.timing[timing.earlyLate] || 1.0;
        
        // 파워 보너스
        const powerCategory = this.calculatePowerCategory(hitData.power);
        const powerMultiplier = this.scoreValues.power[powerCategory];
        
        // 연속 타격 보너스
        this.consecutiveHits++;
        const streakMultiplier = Math.min(
            1 + (this.consecutiveHits * this.scoreValues.streak.multiplier),
            this.scoreValues.streak.maxMultiplier
        );
        
        // 최종 점수 계산
        const finalScore = Math.round(baseScore * timingMultiplier * powerMultiplier * streakMultiplier);
        
        // 점수 추가
        this.totalScore += finalScore;
        this.hitCount++;
        
        // 최고 연속 기록 업데이트
        if (this.consecutiveHits > this.bestStreak) {
            this.bestStreak = this.consecutiveHits;
        }
        
        // 타격 기록 저장
        const hitRecord = {
            pitchNumber: this.pitchResults.length + 1,
            success: true,
            score: finalScore,
            baseScore: baseScore,
            timing: timing.earlyLate,
            contact: hitData.contact,
            power: hitData.power,
            powerCategory: powerCategory,
            streakMultiplier: streakMultiplier,
            position: ball.position.clone(),
            timestamp: Date.now()
        };
        
        this.hitHistory.push(hitRecord);
        this.pitchResults.push(hitRecord);
        
        // UI 업데이트
        this.updateUI();
        this.showHitFeedback(hitRecord);
        
        console.log(`타격 성공! +${finalScore}점 (연속 ${this.consecutiveHits}회)`);
    }
    
    /**
     * 스윙 미스 처리
     */
    handleMiss(missDetail) {
        this.missCount++;
        this.consecutiveHits = 0; // 연속 기록 초기화
        
        // 미스 기록 저장
        const missRecord = {
            pitchNumber: this.pitchResults.length + 1,
            success: false,
            score: 0,
            reason: missDetail.reason || 'missed',
            timestamp: Date.now()
        };
        
        this.pitchResults.push(missRecord);
        
        // UI 업데이트
        this.updateUI();
        this.showMissFeedback();
        
        console.log('스윙 미스!');
    }
    
    /**
     * 스트라이크 처리
     */
    handleStrike(strikeDetail) {
        this.strikeCount++;
        this.consecutiveHits = 0; // 연속 기록 초기화
        
        // 스트라이크 기록 저장
        const strikeRecord = {
            pitchNumber: this.pitchResults.length + 1,
            success: false,
            score: 0,
            reason: strikeDetail.reason || 'no_swing',
            timestamp: Date.now()
        };
        
        this.pitchResults.push(strikeRecord);
        
        // UI 업데이트
        this.updateUI();
        this.showStrikeFeedback();
        
        console.log('스트라이크!');
    }
    
    /**
     * 파워 카테고리 계산
     */
    calculatePowerCategory(power) {
        if (power >= 0.9) return 'homerun';
        if (power >= 0.7) return 'strong';
        if (power >= 0.4) return 'medium';
        return 'weak';
    }
    
    /**
     * 타격 피드백 표시
     */
    showHitFeedback(hitRecord) {
        const feedback = document.getElementById('hitFeedback');
        if (!feedback) return;
        
        let message = '';
        let className = 'feedback-popup show hit';
        
        // 접촉 품질에 따른 메시지
        switch (hitRecord.contact) {
            case 'perfect':
                message = `완벽한 타격! +${hitRecord.score}`;
                className += ' perfect';
                break;
            case 'good':
                message = `좋은 타격! +${hitRecord.score}`;
                break;
            case 'fair':
                message = `타격! +${hitRecord.score}`;
                break;
            case 'poor':
                message = `약한 타격 +${hitRecord.score}`;
                break;
        }
        
        // 연속 타격 보너스 표시
        if (this.consecutiveHits > 1) {
            message += `\n연속 ${this.consecutiveHits}회!`;
        }
        
        feedback.textContent = message;
        feedback.className = className;
        
        // 애니메이션 후 숨기기
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 2000);
        
        // 파티클 효과
        this.createScoreParticle(hitRecord.score);
    }
    
    /**
     * 미스 피드백 표시
     */
    showMissFeedback() {
        const feedback = document.getElementById('hitFeedback');
        if (!feedback) return;
        
        feedback.textContent = '스윙 미스!';
        feedback.className = 'feedback-popup show miss';
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 1500);
    }
    
    /**
     * 스트라이크 피드백 표시
     */
    showStrikeFeedback() {
        const feedback = document.getElementById('hitFeedback');
        if (!feedback) return;
        
        feedback.textContent = '스트라이크!';
        feedback.className = 'feedback-popup show miss';
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 1500);
    }
    
    /**
     * 점수 파티클 효과
     */
    createScoreParticle(score) {
        // 간단한 점수 애니메이션
        const scoreElement = document.getElementById('totalScore');
        if (scoreElement) {
            scoreElement.classList.add('pulse');
            setTimeout(() => {
                scoreElement.classList.remove('pulse');
            }, 600);
        }
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        // 총 점수 업데이트
        const totalScoreElement = document.getElementById('totalScore');
        if (totalScoreElement) {
            totalScoreElement.textContent = this.totalScore.toLocaleString();
        }
        
        // 연속 타격 업데이트
        const hitStreakElement = document.getElementById('hitStreak');
        if (hitStreakElement) {
            hitStreakElement.textContent = this.consecutiveHits;
        }
        
        // 최근 타격 정보 업데이트
        const lastHitInfo = document.getElementById('lastHitInfo');
        if (lastHitInfo && this.hitHistory.length > 0) {
            const lastHit = this.hitHistory[this.hitHistory.length - 1];
            lastHitInfo.innerHTML = `
                최근: ${lastHit.contact.toUpperCase()} (${lastHit.timing})
                <br>+${lastHit.score}점
            `;
        }
    }
    
    /**
     * 게임 완료 처리
     */
    finishGame() {
        // 최종 통계 계산
        const totalPitches = this.pitchResults.length;
        const hitRate = totalPitches > 0 ? (this.hitCount / totalPitches * 100) : 0;
        const avgScore = this.hitCount > 0 ? (this.totalScore / this.hitCount) : 0;
        const avgPower = this.calculateAveragePower();
        const grade = this.calculateGrade();
        
        // 최종 결과 표시
        this.showFinalResults({
            totalScore: this.totalScore,
            hitCount: this.hitCount,
            totalPitches: totalPitches,
            hitRate: hitRate,
            bestStreak: this.bestStreak,
            avgScore: avgScore,
            avgPower: avgPower,
            grade: grade
        });
        
        console.log('게임 완료!', {
            점수: this.totalScore,
            타율: `${hitRate.toFixed(1)}%`,
            등급: grade
        });
    }
    
    /**
     * 평균 파워 계산
     */
    calculateAveragePower() {
        if (this.hitHistory.length === 0) return 0;
        
        const totalPower = this.hitHistory.reduce((sum, hit) => sum + hit.power, 0);
        return totalPower / this.hitHistory.length;
    }
    
    /**
     * 등급 계산
     */
    calculateGrade() {
        if (this.totalScore >= this.gradeThresholds.S) return 'S';
        if (this.totalScore >= this.gradeThresholds.A) return 'A';
        if (this.totalScore >= this.gradeThresholds.B) return 'B';
        if (this.totalScore >= this.gradeThresholds.C) return 'C';
        return 'D';
    }
    
    /**
     * 최종 결과 표시
     */
    showFinalResults(results) {
        // 최종 점수 업데이트
        const finalTotalScore = document.getElementById('finalTotalScore');
        if (finalTotalScore) {
            finalTotalScore.textContent = results.totalScore.toLocaleString();
        }
        
        // 타격 성공률
        const finalHits = document.getElementById('finalHits');
        if (finalHits) {
            finalHits.textContent = `${results.hitCount}/${results.totalPitches}`;
        }
        
        // 최고 연속타격
        const finalBestStreak = document.getElementById('finalBestStreak');
        if (finalBestStreak) {
            finalBestStreak.textContent = results.bestStreak;
        }
        
        // 평균 타격력
        const finalAvgPower = document.getElementById('finalAvgPower');
        if (finalAvgPower) {
            finalAvgPower.textContent = (results.avgPower * 100).toFixed(1) + '%';
        }
        
        // 등급
        const gradeValue = document.getElementById('gradeValue');
        if (gradeValue) {
            gradeValue.textContent = results.grade;
            gradeValue.style.color = this.getGradeColor(results.grade);
        }
        
        // 모달 표시
        const modal = document.getElementById('gameResultModal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    /**
     * 등급별 색상 반환
     */
    getGradeColor(grade) {
        const colors = {
            'S': '#FFD700', // 금색
            'A': '#C0C0C0', // 은색
            'B': '#CD7F32', // 동색
            'C': '#4CAF50', // 녹색
            'D': '#9E9E9E'  // 회색
        };
        
        return colors[grade] || '#9E9E9E';
    }
    
    /**
     * 통계 데이터 반환
     */
    getStats() {
        return {
            totalScore: this.totalScore,
            hitCount: this.hitCount,
            missCount: this.missCount,
            strikeCount: this.strikeCount,
            consecutiveHits: this.consecutiveHits,
            bestStreak: this.bestStreak,
            hitHistory: [...this.hitHistory],
            pitchResults: [...this.pitchResults]
        };
    }
    
    /**
     * 리셋
     */
    reset() {
        this.totalScore = 0;
        this.hitCount = 0;
        this.missCount = 0;
        this.strikeCount = 0;
        this.consecutiveHits = 0;
        this.bestStreak = 0;
        this.hitHistory = [];
        this.pitchResults = [];
        
        // UI 리셋
        this.updateUI();
        
        // 모달 숨기기
        const modal = document.getElementById('gameResultModal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // 피드백 초기화
        const feedback = document.getElementById('hitFeedback');
        if (feedback) {
            feedback.classList.remove('show');
        }
        
        const lastHitInfo = document.getElementById('lastHitInfo');
        if (lastHitInfo) {
            lastHitInfo.textContent = '';
        }
        
        console.log('점수 시스템 리셋');
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.ScoringSystem = ScoringSystem;
}