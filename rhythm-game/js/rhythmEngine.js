/**
 * 리듬 엔진 클래스
 * 리듬 패턴 처리, 타이밍 판정, 노트 생성을 담당
 */
class RhythmEngine {
    constructor(audioManager) {
        this.audioManager = audioManager;
        
        // 현재 스테이지
        this.currentStage = null;
        this.notes = [];
        this.currentNoteIndex = 0;
        
        // 게임 상태
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = 0;
        this.gameTime = 0;
        
        // 타이밍 설정 (히트 라인 기준)
        this.timing = {
            perfect: 0.1,   // ±100ms
            good: 0.25,     // ±250ms
            miss: 0.5       // ±500ms 이후는 Miss
        };
        
        // 노트 표시 설정
        this.noteDisplay = {
            fallTime: 2.0,      // 노트가 떨어지는 시간 (초)
            hitLineY: 80,       // 히트 라인 Y 좌표 (하단에서 80px)
            trackHeight: 300    // 트랙 전체 높이
        };
        
        // 판정 결과
        this.judgmentHistory = [];
        this.lastJudgmentTime = 0;
        
        // 콤보 시스템
        this.combo = 0;
        this.maxCombo = 0;
        
        // 시각 요소
        this.canvas = null;
        this.ctx = null;
        this.notesContainer = null;
        this.hitZone = null;
        
        this.init();
    }
    
    /**
     * 리듬 엔진 초기화
     */
    init() {
        this.setupCanvas();
        this.setupUIElements();
        this.setupEventListeners();
        
        console.log('리듬 엔진 초기화 완료');
    }
    
    /**
     * 캔버스 설정
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
        }
    }
    
    /**
     * UI 요소 설정
     */
    setupUIElements() {
        this.notesContainer = document.getElementById('notesContainer');
        this.hitZone = document.getElementById('hitZone');
        this.hitLineIndicator = document.getElementById('hitLineIndicator');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 오디오 종료 이벤트
        document.addEventListener('audioEnd', () => {
            this.handleStageComplete();
        });
        
        // 창 크기 변경
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    /**
     * 캔버스 크기 조정
     */
    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }
    
    /**
     * 스테이지 설정
     */
    setStage(stage) {
        this.currentStage = stage;
        this.notes = [...stage.notes]; // 노트 복사
        this.currentNoteIndex = 0;
        this.judgmentHistory = [];
        this.combo = 0;
        this.maxCombo = 0;
        
        console.log('스테이지 설정:', stage.title, '노트 수:', this.notes.length);
    }
    
    /**
     * 리듬 엔진 시작
     */
    start() {
        if (!this.currentStage || !this.audioManager) {
            console.error('스테이지 또는 오디오 매니저가 설정되지 않았습니다');
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.gameTime = 0;
        
        // 렌더링 루프 시작
        this.startRenderLoop();
        
        console.log('리듬 엔진 시작');
    }
    
    /**
     * 리듬 엔진 일시정지
     */
    pause() {
        this.isPaused = true;
        console.log('리듬 엔진 일시정지');
    }
    
    /**
     * 리듬 엔진 재개
     */
    resume() {
        this.isPaused = false;
        this.startTime = Date.now() - this.gameTime;
        console.log('리듬 엔진 재개');
    }
    
    /**
     * 리듬 엔진 정지
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.clearVisualNotes();
        
        console.log('리듬 엔진 정지');
    }
    
    /**
     * 렌더링 루프 시작
     */
    startRenderLoop() {
        const render = () => {
            if (!this.isRunning) return;
            
            if (!this.isPaused) {
                this.update();
                this.render();
            }
            
            requestAnimationFrame(render);
        };
        
        render();
    }
    
    /**
     * 게임 업데이트
     */
    update() {
        // 게임 시간 업데이트
        this.gameTime = Date.now() - this.startTime;
        const audioTime = this.audioManager.getCurrentTime();
        
        // 새로운 노트 생성 확인
        this.checkNewNotes(audioTime);
        
        // 활성 노트 업데이트
        this.updateActiveNotes(audioTime);
        
        // 놓친 노트 처리
        this.checkMissedNotes(audioTime);
    }
    
    /**
     * 새로운 노트 생성 확인
     */
    checkNewNotes(currentTime) {
        while (this.currentNoteIndex < this.notes.length) {
            const note = this.notes[this.currentNoteIndex];
            const showTime = note.time - this.noteDisplay.fallTime;
            
            if (currentTime >= showTime) {
                this.createVisualNote(note);
                this.currentNoteIndex++;
            } else {
                break;
            }
        }
    }
    
    /**
     * 시각적 노트 생성
     */
    createVisualNote(note) {
        console.log('노트 생성:', note.time + '초', '강도:', note.intensity);
        
        const noteElement = document.createElement('div');
        noteElement.className = 'rhythm-note';
        noteElement.dataset.noteId = note.id;
        noteElement.dataset.noteTime = note.time;
        
        // 노트 스타일 설정
        const intensity = note.intensity || 1;
        if (intensity > 0.8) {
            noteElement.classList.add('perfect');
        }
        
        // 애니메이션 설정
        noteElement.style.animationDuration = this.noteDisplay.fallTime + 's';
        noteElement.style.animationDelay = '0s';
        
        // 컨테이너에 추가
        if (this.notesContainer) {
            this.notesContainer.appendChild(noteElement);
        }
        
        // 노트 데이터 저장
        noteElement.noteData = note;
        
        // 일정 시간 후 자동 제거 (Miss 처리용)
        setTimeout(() => {
            this.removeVisualNote(noteElement, true);
        }, (this.noteDisplay.fallTime + 1) * 1000);
    }
    
    /**
     * 시각적 노트 제거
     */
    removeVisualNote(noteElement, isMiss = false) {
        if (noteElement && noteElement.parentNode) {
            if (isMiss && !noteElement.processed) {
                // Miss 처리
                this.processMiss(noteElement.noteData);
                noteElement.processed = true;
            }
            
            noteElement.parentNode.removeChild(noteElement);
        }
    }
    
    /**
     * 활성 노트 업데이트
     */
    updateActiveNotes(currentTime) {
        // DOM에서 현재 활성 노트들 확인
        const activeNotes = this.notesContainer?.querySelectorAll('.rhythm-note') || [];
        
        activeNotes.forEach(noteElement => {
            const noteTime = parseFloat(noteElement.dataset.noteTime);
            const timeDiff = currentTime - noteTime; // 절댓값 제거
            
            // 노트가 히트 라인을 지나가는 시점에서 판정 범위 시각화
            // noteTime이 정확히 노트가 히트 라인에 도달하는 시간
            if (Math.abs(timeDiff) <= this.timing.good) {
                noteElement.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            } else {
                noteElement.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.6)';
            }
        });
    }
    
    /**
     * 놓친 노트 처리
     */
    checkMissedNotes(currentTime) {
        const activeNotes = this.notesContainer?.querySelectorAll('.rhythm-note') || [];
        
        activeNotes.forEach(noteElement => {
            const noteTime = parseFloat(noteElement.dataset.noteTime);
            const timeDiff = currentTime - noteTime;
            
            // Miss 범위를 벗어난 노트 처리
            if (timeDiff > this.timing.miss && !noteElement.processed) {
                this.processMiss(noteElement.noteData);
                noteElement.processed = true;
                this.removeVisualNote(noteElement);
            }
        });
    }
    
    /**
     * 리듬 입력 처리
     */
    processRhythmInput(intensity) {
        const currentTime = this.audioManager.getCurrentTime();
        console.log('리듬 입력 처리 - 현재 시간:', currentTime, '강도:', intensity);
        
        // 가장 가까운 노트 찾기
        const closestNote = this.findClosestNote(currentTime);
        
        if (closestNote) {
            console.log('가장 가까운 노트 발견:', closestNote.time, '차이:', Math.abs(currentTime - closestNote.time));
            const judgment = this.calculateJudgment(currentTime, closestNote.time);
            this.processJudgment(judgment, closestNote, intensity);
            
            // 처리된 노트 시각 요소 제거
            this.removeProcessedNote(closestNote.id);
        } else {
            console.log('근처에 노트가 없음 - Miss 처리');
            // 근처에 노트가 없으면 Miss
            this.processMiss();
        }
    }
    
    /**
     * 가장 가까운 노트 찾기
     */
    findClosestNote(currentTime) {
        const activeNotes = this.notesContainer?.querySelectorAll('.rhythm-note') || [];
        console.log('활성 노트 수:', activeNotes.length);
        
        let closestNote = null;
        let minDistance = Infinity;
        
        activeNotes.forEach(noteElement => {
            if (noteElement.processed) return;
            
            const noteTime = parseFloat(noteElement.dataset.noteTime);
            const distance = Math.abs(currentTime - noteTime);
            
            if (distance < minDistance && distance <= this.timing.miss) {
                minDistance = distance;
                closestNote = noteElement.noteData;
                console.log('선택 가능한 노트:', noteTime, '거리:', distance.toFixed(3), '초');
            }
        });
        
        if (closestNote) {
            console.log('선택된 노트:', closestNote.time, '최소 거리:', minDistance);
        }
        
        return closestNote;
    }
    
    /**
     * 타이밍 판정 계산
     */
    calculateJudgment(inputTime, noteTime) {
        const timeDiff = Math.abs(inputTime - noteTime);
        
        if (timeDiff <= this.timing.perfect) {
            return { type: 'perfect', accuracy: 1.0 - (timeDiff / this.timing.perfect) };
        } else if (timeDiff <= this.timing.good) {
            return { type: 'good', accuracy: 1.0 - (timeDiff / this.timing.good) };
        } else {
            return { type: 'miss', accuracy: 0 };
        }
    }
    
    /**
     * 판정 처리
     */
    processJudgment(judgment, note, intensity) {
        // 점수 계산
        const baseScore = this.calculateScore(judgment, note, intensity);
        const comboMultiplier = Math.min(1 + (this.combo * 0.01), 2.0); // 최대 2배
        const finalScore = Math.round(baseScore * comboMultiplier);
        
        // 콤보 업데이트
        if (judgment.type !== 'miss') {
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
        } else {
            this.combo = 0;
        }
        
        // 판정 기록
        const inputTime = this.audioManager.getCurrentTime();
        const judgmentData = {
            type: judgment.type,
            score: finalScore,
            timing: inputTime,
            noteTime: note.time,
            accuracy: judgment.accuracy,
            intensity: intensity,
            combo: this.combo
        };
        
        this.judgmentHistory.push(judgmentData);
        this.lastJudgmentTime = Date.now();
        
        // 판정 이벤트 발생
        this.dispatchJudgmentEvent(judgmentData);
        
        // 히트 존 애니메이션
        this.animateHitZone(judgment.type);
        
        // 효과음 재생
        this.playJudgmentSound(judgment.type);
        
        console.log(`판정: ${judgment.type}, 점수: ${finalScore}, 콤보: ${this.combo}`);
    }
    
    /**
     * Miss 처리
     */
    processMiss(note = null) {
        this.combo = 0;
        
        const judgmentData = {
            type: 'miss',
            score: 0,
            timing: this.audioManager.getCurrentTime(),
            noteTime: note ? note.time : 0,
            accuracy: 0,
            intensity: 0,
            combo: 0
        };
        
        this.judgmentHistory.push(judgmentData);
        
        // Miss 이벤트 발생
        this.dispatchJudgmentEvent(judgmentData);
        
        // 히트 존 애니메이션
        this.animateHitZone('miss');
        
        console.log('Miss');
    }
    
    /**
     * 점수 계산
     */
    calculateScore(judgment, note, intensity) {
        const baseScores = {
            perfect: 1000,
            good: 500,
            miss: 0
        };
        
        const baseScore = baseScores[judgment.type] || 0;
        const accuracyMultiplier = judgment.accuracy;
        const intensityMultiplier = 0.5 + (intensity * 0.5); // 0.5 ~ 1.0
        const noteMultiplier = note.intensity || 1.0;
        
        return Math.round(baseScore * accuracyMultiplier * intensityMultiplier * noteMultiplier);
    }
    
    /**
     * 판정 이벤트 발생
     */
    dispatchJudgmentEvent(judgmentData) {
        const event = new CustomEvent('rhythmJudgment', {
            detail: judgmentData
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 처리된 노트 제거
     */
    removeProcessedNote(noteId) {
        const noteElement = this.notesContainer?.querySelector(`[data-note-id="${noteId}"]`);
        if (noteElement) {
            noteElement.processed = true;
            this.removeVisualNote(noteElement);
        }
    }
    
    /**
     * 히트 존 애니메이션
     */
    animateHitZone(judgmentType) {
        if (!this.hitZone || !this.hitLineIndicator) return;
        
        // 기존 애니메이션 클래스 제거
        this.hitZone.classList.remove('active');
        this.hitLineIndicator.classList.remove('active');
        
        // 새 애니메이션 트리거
        setTimeout(() => {
            this.hitZone.classList.add('active');
            this.hitLineIndicator.classList.add('active');
            
            // 애니메이션 완료 후 원래 상태로
            setTimeout(() => {
                this.hitZone.classList.remove('active');
                this.hitLineIndicator.classList.remove('active');
            }, 300);
        }, 10);
    }
    
    /**
     * 판정 효과음 재생
     */
    playJudgmentSound(judgmentType) {
        if (!this.audioManager) return;
        
        const frequencies = {
            perfect: 880,  // A5
            good: 660,     // E5
            miss: 220      // A3
        };
        
        const frequency = frequencies[judgmentType] || 440;
        this.audioManager.playSound(frequency, 0.1, 0.2);
    }
    
    /**
     * 스테이지 완료 처리
     */
    handleStageComplete() {
        this.stop();
        
        // 완료 통계 계산
        const stats = this.calculateFinalStats();
        
        // 완료 이벤트 발생
        const completeEvent = new CustomEvent('stageComplete', {
            detail: stats
        });
        document.dispatchEvent(completeEvent);
        
        console.log('스테이지 완료:', stats);
    }
    
    /**
     * 최종 통계 계산
     */
    calculateFinalStats() {
        const totalNotes = this.notes.length;
        const judgments = { perfect: 0, good: 0, miss: 0 };
        let totalScore = 0;
        
        this.judgmentHistory.forEach(judgment => {
            judgments[judgment.type]++;
            totalScore += judgment.score;
        });
        
        const hitRate = totalNotes > 0 ? ((judgments.perfect + judgments.good) / totalNotes) * 100 : 0;
        const accuracy = totalNotes > 0 ? (judgments.perfect / totalNotes) * 100 : 0;
        
        return {
            totalScore,
            maxCombo: this.maxCombo,
            hitRate: Math.round(hitRate),
            accuracy: Math.round(accuracy),
            judgments,
            totalNotes
        };
    }
    
    /**
     * 모든 시각적 노트 제거
     */
    clearVisualNotes() {
        if (this.notesContainer) {
            this.notesContainer.innerHTML = '';
        }
    }
    
    /**
     * 캔버스 렌더링
     */
    render() {
        if (!this.ctx) return;
        
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경 그라디언트
        this.renderBackground();
        
        // 리듬 시각화
        this.renderRhythmVisualization();
    }
    
    /**
     * 배경 렌더링
     */
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.9)');
        gradient.addColorStop(0.5, 'rgba(22, 33, 62, 0.9)');
        gradient.addColorStop(1, 'rgba(15, 52, 96, 0.9)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 리듬 시각화 렌더링
     */
    renderRhythmVisualization() {
        // 주파수 데이터 가져오기
        const frequencyData = this.audioManager.getFrequencyData();
        if (!frequencyData) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        
        // 원형 시각화
        this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        for (let i = 0; i < frequencyData.length; i++) {
            const angle = (i / frequencyData.length) * Math.PI * 2;
            const value = frequencyData[i] / 255;
            const x = centerX + Math.cos(angle) * (radius + value * 50);
            const y = centerY + Math.sin(angle) * (radius + value * 50);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        
        // 중심 원
        this.ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        this.stop();
        this.clearVisualNotes();
        console.log('리듬 엔진 리소스 정리 완료');
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.RhythmEngine = RhythmEngine;
}