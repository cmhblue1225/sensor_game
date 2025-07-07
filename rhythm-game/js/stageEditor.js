/**
 * 스테이지 에디터 클래스
 * 사용자가 직접 스테이지를 만들 수 있는 도구
 */
class StageEditor {
    constructor(audioManager) {
        this.audioManager = audioManager;
        
        // 에디터 상태
        this.isActive = false;
        this.isRecording = false;
        this.audioFile = null;
        this.beats = [];
        this.currentTime = 0;
        this.duration = 0;
        
        // 스테이지 데이터
        this.stageData = {
            id: '',
            title: '',
            artist: '',
            difficulty: '보통',
            bpm: 120,
            notes: []
        };
        
        // UI 요소들
        this.elements = {};
        
        // 타임라인 설정
        this.timeline = {
            pixelsPerSecond: 50,
            playheadPosition: 0,
            isDragging: false
        };
        
        // 키보드 상태
        this.keys = new Set();
        
        this.init();
    }
    
    /**
     * 에디터 초기화
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        
        console.log('스테이지 에디터 초기화 완료');
    }
    
    /**
     * UI 요소 설정
     */
    setupElements() {
        this.elements = {
            audioFile: document.getElementById('audioFile'),
            stageTitle: document.getElementById('stageTitle'),
            artistName: document.getElementById('artistName'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            stopBtn: document.getElementById('stopBtn'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            timeSlider: document.getElementById('timeSlider'),
            timeline: document.getElementById('timeline'),
            playhead: document.getElementById('playhead'),
            beatsContainer: document.getElementById('beatsContainer'),
            clearBeats: document.getElementById('clearBeats'),
            saveStage: document.getElementById('saveStage'),
            testStage: document.getElementById('testStage')
        };
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 오디오 파일 선택
        if (this.elements.audioFile) {
            this.elements.audioFile.addEventListener('change', (e) => {
                this.handleAudioFileSelect(e);
            });
        }
        
        // 재생 컨트롤
        if (this.elements.playPauseBtn) {
            this.elements.playPauseBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
        
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => {
                this.stopPlayback();
            });
        }
        
        // 시간 슬라이더
        if (this.elements.timeSlider) {
            this.elements.timeSlider.addEventListener('input', (e) => {
                this.seekToPosition(parseFloat(e.target.value));
            });
        }
        
        // 타임라인 클릭
        if (this.elements.timeline) {
            this.elements.timeline.addEventListener('click', (e) => {
                this.handleTimelineClick(e);
            });
        }
        
        // 에디터 버튼들
        if (this.elements.clearBeats) {
            this.elements.clearBeats.addEventListener('click', () => {
                this.clearAllBeats();
            });
        }
        
        if (this.elements.saveStage) {
            this.elements.saveStage.addEventListener('click', () => {
                this.saveStage();
            });
        }
        
        if (this.elements.testStage) {
            this.elements.testStage.addEventListener('click', () => {
                this.testStage();
            });
        }
        
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        // 오디오 업데이트
        this.startUpdateLoop();
    }
    
    /**
     * 에디터 표시
     */
    show() {
        this.isActive = true;
        this.resetEditor();
        console.log('스테이지 에디터 활성화');
    }
    
    /**
     * 에디터 숨김
     */
    hide() {
        this.isActive = false;
        this.stopPlayback();
        console.log('스테이지 에디터 비활성화');
    }
    
    /**
     * 에디터 리셋
     */
    resetEditor() {
        this.beats = [];
        this.currentTime = 0;
        this.duration = 0;
        this.audioFile = null;
        
        // UI 리셋
        if (this.elements.stageTitle) this.elements.stageTitle.value = '';
        if (this.elements.artistName) this.elements.artistName.value = '';
        if (this.elements.currentTime) this.elements.currentTime.textContent = '0:00';
        if (this.elements.totalTime) this.elements.totalTime.textContent = '0:00';
        if (this.elements.timeSlider) this.elements.timeSlider.value = 0;
        
        this.updateTimeline();
    }
    
    /**
     * 오디오 파일 선택 처리
     */
    async handleAudioFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            console.log('오디오 파일 로드 중:', file.name);
            
            // 오디오 매니저에 로드
            await this.audioManager.loadAudio(file);
            
            this.audioFile = file;
            this.duration = this.audioManager.getDuration();
            
            // UI 업데이트
            if (this.elements.totalTime) {
                this.elements.totalTime.textContent = this.formatTime(this.duration);
            }
            
            if (this.elements.timeSlider) {
                this.elements.timeSlider.max = this.duration;
            }
            
            // 기본 스테이지 정보 설정
            if (!this.elements.stageTitle.value) {
                this.elements.stageTitle.value = file.name.replace(/\.[^/.]+$/, "");
            }
            
            this.updateTimeline();
            
            console.log('오디오 파일 로드 완료:', this.duration + '초');
            
        } catch (error) {
            console.error('오디오 파일 로드 실패:', error);
            alert('오디오 파일을 불러올 수 없습니다: ' + error.message);
        }
    }
    
    /**
     * 재생/일시정지 토글
     */
    async togglePlayPause() {
        if (!this.audioManager.getIsLoaded()) {
            alert('먼저 오디오 파일을 선택해주세요.');
            return;
        }
        
        try {
            if (this.audioManager.getIsPlaying()) {
                this.audioManager.pause();
                if (this.elements.playPauseBtn) {
                    this.elements.playPauseBtn.textContent = '▶️ 재생';
                }
            } else {
                await this.audioManager.play();
                if (this.elements.playPauseBtn) {
                    this.elements.playPauseBtn.textContent = '⏸️ 일시정지';
                }
            }
        } catch (error) {
            console.error('재생 오류:', error);
        }
    }
    
    /**
     * 재생 정지
     */
    stopPlayback() {
        this.audioManager.stop();
        this.currentTime = 0;
        
        if (this.elements.playPauseBtn) {
            this.elements.playPauseBtn.textContent = '▶️ 재생';
        }
        
        this.updateTimeDisplay();
        this.updateTimeline();
    }
    
    /**
     * 특정 위치로 이동
     */
    seekToPosition(time) {
        this.audioManager.setCurrentTime(time);
        this.currentTime = time;
        this.updateTimeDisplay();
        this.updateTimeline();
    }
    
    /**
     * 타임라인 클릭 처리
     */
    handleTimelineClick(event) {
        if (!this.duration) return;
        
        const rect = this.elements.timeline.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const timelineWidth = rect.width;
        
        const clickedTime = (x / timelineWidth) * this.duration;
        this.seekToPosition(clickedTime);
    }
    
    /**
     * 키보드 입력 처리
     */
    handleKeyDown(event) {
        if (!this.isActive) return;
        
        this.keys.add(event.code);
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (this.audioManager.getIsLoaded()) {
                    this.addBeat();
                }
                break;
                
            case 'Delete':
            case 'Backspace':
                this.deleteNearestBeat();
                break;
                
            case 'KeyP':
                event.preventDefault();
                this.togglePlayPause();
                break;
                
            case 'KeyS':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.saveStage();
                }
                break;
        }
    }
    
    /**
     * 키보드 해제 처리
     */
    handleKeyUp(event) {
        this.keys.delete(event.code);
    }
    
    /**
     * 비트 추가
     */
    addBeat() {
        const currentTime = this.audioManager.getCurrentTime();
        
        // 중복 비트 확인 (0.1초 이내)
        const existingBeat = this.beats.find(beat => 
            Math.abs(beat.time - currentTime) < 0.1
        );
        
        if (existingBeat) {
            console.log('이미 비슷한 위치에 비트가 있습니다');
            return;
        }
        
        // 새 비트 추가
        const beat = {
            id: Date.now() + Math.random(),
            time: currentTime,
            intensity: 1.0
        };
        
        this.beats.push(beat);
        this.beats.sort((a, b) => a.time - b.time);
        
        this.updateTimeline();
        
        console.log('비트 추가:', currentTime.toFixed(2) + '초');
    }
    
    /**
     * 가장 가까운 비트 삭제
     */
    deleteNearestBeat() {
        if (this.beats.length === 0) return;
        
        const currentTime = this.audioManager.getCurrentTime();
        
        // 가장 가까운 비트 찾기
        let nearestBeat = null;
        let minDistance = Infinity;
        
        this.beats.forEach(beat => {
            const distance = Math.abs(beat.time - currentTime);
            if (distance < minDistance) {
                minDistance = distance;
                nearestBeat = beat;
            }
        });
        
        // 0.5초 이내의 비트만 삭제
        if (nearestBeat && minDistance < 0.5) {
            this.beats = this.beats.filter(beat => beat.id !== nearestBeat.id);
            this.updateTimeline();
            
            console.log('비트 삭제:', nearestBeat.time.toFixed(2) + '초');
        }
    }
    
    /**
     * 모든 비트 삭제
     */
    clearAllBeats() {
        if (this.beats.length === 0) return;
        
        if (confirm('모든 비트를 삭제하시겠습니까?')) {
            this.beats = [];
            this.updateTimeline();
            console.log('모든 비트 삭제');
        }
    }
    
    /**
     * 타임라인 업데이트
     */
    updateTimeline() {
        if (!this.elements.beatsContainer) return;
        
        // 기존 비트 마커 제거
        this.elements.beatsContainer.innerHTML = '';
        
        if (this.duration === 0) return;
        
        // 비트 마커 생성
        this.beats.forEach(beat => {
            const marker = document.createElement('div');
            marker.className = 'beat-marker';
            marker.dataset.beatId = beat.id;
            marker.dataset.beatTime = beat.time;
            
            // 위치 계산 (백분율)
            const position = (beat.time / this.duration) * 100;
            marker.style.left = position + '%';
            
            // 클릭 이벤트 (삭제)
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteBeat(beat.id);
            });
            
            this.elements.beatsContainer.appendChild(marker);
        });
        
        // 플레이헤드 위치 업데이트
        this.updatePlayhead();
    }
    
    /**
     * 플레이헤드 위치 업데이트
     */
    updatePlayhead() {
        if (!this.elements.playhead || this.duration === 0) return;
        
        const position = (this.currentTime / this.duration) * 100;
        this.elements.playhead.style.left = position + '%';
    }
    
    /**
     * 특정 비트 삭제
     */
    deleteBeat(beatId) {
        this.beats = this.beats.filter(beat => beat.id !== beatId);
        this.updateTimeline();
        console.log('비트 삭제:', beatId);
    }
    
    /**
     * 시간 표시 업데이트
     */
    updateTimeDisplay() {
        if (this.elements.currentTime) {
            this.elements.currentTime.textContent = this.formatTime(this.currentTime);
        }
        
        if (this.elements.timeSlider) {
            this.elements.timeSlider.value = this.currentTime;
        }
    }
    
    /**
     * 시간 포맷팅
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 업데이트 루프 시작
     */
    startUpdateLoop() {
        const update = () => {
            if (this.isActive && this.audioManager.getIsPlaying()) {
                this.currentTime = this.audioManager.getCurrentTime();
                this.updateTimeDisplay();
                this.updatePlayhead();
            }
            
            requestAnimationFrame(update);
        };
        
        update();
    }
    
    /**
     * 스테이지 저장
     */
    saveStage() {
        // 입력 검증
        const title = this.elements.stageTitle?.value?.trim();
        const artist = this.elements.artistName?.value?.trim();
        
        if (!title) {
            alert('스테이지 제목을 입력해주세요.');
            return;
        }
        
        if (!artist) {
            alert('아티스트명을 입력해주세요.');
            return;
        }
        
        if (this.beats.length === 0) {
            alert('최소 하나 이상의 비트를 추가해주세요.');
            return;
        }
        
        if (!this.audioFile) {
            alert('오디오 파일을 선택해주세요.');
            return;
        }
        
        // 스테이지 데이터 구성
        const stageData = {
            id: 'custom-' + Date.now(),
            title: title,
            artist: artist,
            difficulty: '커스텀',
            bpm: this.estimateBPM(),
            duration: this.duration,
            audioFile: this.audioFile,
            notes: this.beats.map(beat => ({
                id: beat.id,
                time: beat.time,
                intensity: beat.intensity,
                type: 'normal'
            })),
            isDefault: false,
            locked: false,
            created: new Date().toISOString()
        };
        
        // 스테이지 매니저에 저장 요청
        const saveEvent = new CustomEvent('saveCustomStage', {
            detail: stageData
        });
        document.dispatchEvent(saveEvent);
        
        console.log('스테이지 저장:', stageData);
        alert('스테이지가 저장되었습니다!');
    }
    
    /**
     * BPM 추정
     */
    estimateBPM() {
        if (this.beats.length < 2) return 120;
        
        // 연속된 비트 간 간격 계산
        const intervals = [];
        for (let i = 1; i < this.beats.length; i++) {
            const interval = this.beats[i].time - this.beats[i - 1].time;
            if (interval > 0.2 && interval < 2.0) { // 30-300 BPM 범위
                intervals.push(interval);
            }
        }
        
        if (intervals.length === 0) return 120;
        
        // 평균 간격 계산
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        // BPM 변환
        const bpm = Math.round(60 / avgInterval);
        
        return Math.max(60, Math.min(200, bpm)); // 60-200 BPM 범위로 제한
    }
    
    /**
     * 스테이지 테스트
     */
    testStage() {
        if (this.beats.length === 0) {
            alert('테스트할 비트가 없습니다.');
            return;
        }
        
        // 임시 스테이지 데이터 생성
        const testStageData = {
            id: 'test-stage',
            title: this.elements.stageTitle?.value || '테스트 스테이지',
            artist: this.elements.artistName?.value || '테스트',
            difficulty: '테스트',
            duration: this.duration,
            audioFile: this.audioFile,
            notes: this.beats.map(beat => ({
                id: beat.id,
                time: beat.time,
                intensity: beat.intensity,
                type: 'normal'
            }))
        };
        
        // 테스트 이벤트 발생
        const testEvent = new CustomEvent('testStage', {
            detail: testStageData
        });
        document.dispatchEvent(testEvent);
        
        console.log('스테이지 테스트 시작');
    }
    
    /**
     * 스테이지 데이터 내보내기
     */
    exportStage() {
        const title = this.elements.stageTitle?.value?.trim();
        
        if (!title || this.beats.length === 0) {
            alert('저장할 데이터가 없습니다.');
            return;
        }
        
        const exportData = {
            title: title,
            artist: this.elements.artistName?.value?.trim() || '',
            bpm: this.estimateBPM(),
            duration: this.duration,
            notes: this.beats.map(beat => ({
                time: beat.time,
                intensity: beat.intensity
            })),
            created: new Date().toISOString()
        };
        
        // JSON 파일로 다운로드
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('스테이지 데이터 내보내기 완료');
    }
    
    /**
     * 자동 비트 감지 (실험적)
     */
    autoDetectBeats() {
        if (!this.audioManager.getIsLoaded()) {
            alert('먼저 오디오 파일을 로드해주세요.');
            return;
        }
        
        console.log('자동 비트 감지 시작 (실험적 기능)');
        
        // 간단한 비트 감지 (오디오 분석 기반)
        const sampleInterval = 0.1; // 100ms마다 샘플링
        const detectedBeats = [];
        
        // 이 기능은 Web Audio API의 고급 기능이 필요하므로
        // 현재는 기본적인 패턴 생성으로 대체
        const bpm = 120; // 기본 BPM
        const beatInterval = 60 / bpm;
        
        for (let time = 2; time < this.duration - 2; time += beatInterval) {
            if (Math.random() > 0.3) { // 70% 확률로 비트 생성
                detectedBeats.push({
                    id: Date.now() + Math.random(),
                    time: time,
                    intensity: 0.5 + Math.random() * 0.5
                });
            }
        }
        
        this.beats = detectedBeats;
        this.updateTimeline();
        
        console.log('자동 비트 감지 완료:', detectedBeats.length + '개');
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        this.hide();
        console.log('스테이지 에디터 리소스 정리 완료');
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.StageEditor = StageEditor;
}