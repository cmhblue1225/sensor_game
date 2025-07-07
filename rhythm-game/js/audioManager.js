/**
 * 오디오 매니저 클래스
 * 음악 재생 및 오디오 처리를 담당
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioElement = null;
        this.sourceNode = null;
        this.analyserNode = null;
        this.gainNode = null;
        
        // 재생 상태
        this.isPlaying = false;
        this.isPaused = false;
        this.isLoaded = false;
        this.currentTime = 0;
        this.duration = 0;
        
        // 오디오 분석 데이터
        this.frequencyData = null;
        this.dataArray = null;
        
        // 볼륨 설정
        this.volume = 0.7;
        
        this.init();
    }
    
    /**
     * 오디오 매니저 초기화
     */
    async init() {
        try {
            // AudioContext 생성 (브라우저 호환성)
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            // 사용자 제스처 후 AudioContext 활성화
            this.setupAudioContextActivation();
            
            console.log('오디오 매니저 초기화 완료');
            
        } catch (error) {
            console.error('오디오 매니저 초기화 실패:', error);
            // 폴백: 기본 HTML5 오디오만 사용
            this.setupFallbackAudio();
        }
    }
    
    /**
     * AudioContext 활성화 설정
     */
    setupAudioContextActivation() {
        const activateAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('AudioContext 활성화됨');
                });
            }
        };
        
        // 첫 번째 사용자 상호작용에서 활성화
        document.addEventListener('click', activateAudio, { once: true });
        document.addEventListener('keydown', activateAudio, { once: true });
        document.addEventListener('touchstart', activateAudio, { once: true });
    }
    
    /**
     * 폴백 오디오 설정
     */
    setupFallbackAudio() {
        console.log('폴백 모드: 기본 HTML5 오디오 사용');
        this.audioContext = null;
    }
    
    /**
     * 오디오 파일 로드
     */
    async loadAudio(audioFile) {
        try {
            // 기존 오디오 정리
            this.cleanup();
            
            // audioFile이 null이면 프로시저럴 오디오 사용
            if (!audioFile) {
                console.log('프로시저럴 오디오 모드 사용');
                this.setupProceduralAudio();
                return;
            }
            
            // 새 오디오 엘리먼트 생성
            this.audioElement = new Audio();
            this.audioElement.crossOrigin = 'anonymous';
            
            // 이벤트 리스너 설정
            this.setupAudioEventListeners();
            
            // 파일 로드
            if (typeof audioFile === 'string') {
                // URL에서 로드
                this.audioElement.src = audioFile;
            } else if (audioFile instanceof File) {
                // 파일 객체에서 로드
                const url = URL.createObjectURL(audioFile);
                this.audioElement.src = url;
            } else {
                throw new Error('지원되지 않는 오디오 파일 형식');
            }
            
            // 로드 완료 대기
            await new Promise((resolve, reject) => {
                this.audioElement.onloadedmetadata = () => {
                    this.duration = this.audioElement.duration;
                    this.isLoaded = true;
                    resolve();
                };
                
                this.audioElement.onerror = (error) => {
                    reject(new Error('오디오 로드 실패: ' + error.message));
                };
                
                // 타임아웃 설정 (10초)
                setTimeout(() => {
                    if (!this.isLoaded) {
                        reject(new Error('오디오 로드 타임아웃'));
                    }
                }, 10000);
            });
            
            // Web Audio API 설정
            if (this.audioContext) {
                await this.setupWebAudioNodes();
            }
            
            console.log('오디오 로드 완료:', this.duration + '초');
            
        } catch (error) {
            console.error('오디오 로드 실패:', error);
            throw error;
        }
    }
    
    /**
     * Web Audio API 노드 설정
     */
    async setupWebAudioNodes() {
        if (!this.audioContext || !this.audioElement) return;
        
        try {
            // 소스 노드 생성
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
            
            // 분석기 노드 생성
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 256;
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            // 게인 노드 생성
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.volume;
            
            // 주파수 데이터 배열 생성
            this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
            this.dataArray = new Uint8Array(this.analyserNode.fftSize);
            
            // 노드 연결: source -> analyser -> gain -> destination
            this.sourceNode.connect(this.analyserNode);
            this.analyserNode.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            console.log('Web Audio API 노드 설정 완료');
            
        } catch (error) {
            console.error('Web Audio API 설정 실패:', error);
            // 폴백: 기본 오디오만 사용
        }
    }
    
    /**
     * 오디오 이벤트 리스너 설정
     */
    setupAudioEventListeners() {
        if (!this.audioElement) return;
        
        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.handleAudioEnd();
        });
        
        this.audioElement.addEventListener('error', (error) => {
            console.error('오디오 재생 오류:', error);
        });
        
        this.audioElement.addEventListener('canplaythrough', () => {
            console.log('오디오 재생 준비 완료');
        });
    }
    
    /**
     * 재생 시작
     */
    async play() {
        if (!this.isLoaded) {
            console.error('오디오가 로드되지 않았습니다');
            return;
        }
        
        // 프로시저럴 모드인 경우
        if (this.proceduralMode) {
            this.startProceduralPlayback();
            return;
        }
        
        // 일반 오디오 파일인 경우
        if (!this.audioElement) {
            console.error('오디오 엘리먼트가 없습니다');
            return;
        }
        
        try {
            await this.audioElement.play();
            this.isPlaying = true;
            this.isPaused = false;
            
            console.log('오디오 재생 시작');
            
        } catch (error) {
            console.error('오디오 재생 실패:', error);
            throw error;
        }
    }
    
    /**
     * 재생 일시정지
     */
    pause() {
        if (this.isPlaying) {
            if (this.proceduralMode) {
                this.isPlaying = false;
                this.isPaused = true;
            } else if (this.audioElement) {
                this.audioElement.pause();
                this.isPlaying = false;
                this.isPaused = true;
            }
            
            console.log('오디오 일시정지');
        }
    }
    
    /**
     * 재생 재개
     */
    async resume() {
        if (this.isPaused) {
            if (this.proceduralMode) {
                this.startProceduralPlayback();
            } else if (this.audioElement) {
                try {
                    await this.audioElement.play();
                    this.isPlaying = true;
                    this.isPaused = false;
                    
                    console.log('오디오 재생 재개');
                    
                } catch (error) {
                    console.error('오디오 재생 재개 실패:', error);
                }
            }
        }
    }
    
    /**
     * 재생 정지
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        
        if (this.proceduralMode) {
            // 프로시저럴 모드 정지
            console.log('프로시저럴 오디오 정지');
        } else if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            console.log('오디오 정지');
        }
    }
    
    /**
     * 재생 위치 설정
     */
    setCurrentTime(time) {
        if (this.audioElement && this.isLoaded) {
            this.audioElement.currentTime = Math.max(0, Math.min(time, this.duration));
            this.currentTime = this.audioElement.currentTime;
        }
    }
    
    /**
     * 볼륨 설정
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
        
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }
    
    /**
     * 현재 재생 시간 반환
     */
    getCurrentTime() {
        return this.currentTime;
    }
    
    /**
     * 총 재생 시간 반환
     */
    getDuration() {
        return this.duration;
    }
    
    /**
     * 재생 진행률 반환 (0-100)
     */
    getProgress() {
        if (this.duration === 0) return 0;
        return (this.currentTime / this.duration) * 100;
    }
    
    /**
     * 재생 상태 확인
     */
    getIsPlaying() {
        return this.isPlaying;
    }
    
    /**
     * 로드 상태 확인
     */
    getIsLoaded() {
        return this.isLoaded;
    }
    
    /**
     * 주파수 데이터 반환 (시각화용)
     */
    getFrequencyData() {
        if (this.analyserNode && this.frequencyData) {
            this.analyserNode.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return null;
    }
    
    /**
     * 시간 도메인 데이터 반환 (파형 시각화용)
     */
    getTimeDomainData() {
        if (this.analyserNode && this.dataArray) {
            this.analyserNode.getByteTimeDomainData(this.dataArray);
            return this.dataArray;
        }
        return null;
    }
    
    /**
     * 평균 볼륨 계산
     */
    getAverageVolume() {
        const frequencyData = this.getFrequencyData();
        if (!frequencyData) return 0;
        
        let sum = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            sum += frequencyData[i];
        }
        
        return sum / frequencyData.length / 255; // 0-1 범위로 정규화
    }
    
    /**
     * 특정 주파수 대역의 에너지 계산
     */
    getFrequencyBandEnergy(lowFreq, highFreq) {
        const frequencyData = this.getFrequencyData();
        if (!frequencyData) return 0;
        
        const sampleRate = this.audioContext?.sampleRate || 44100;
        const binSize = sampleRate / 2 / frequencyData.length;
        
        const lowBin = Math.floor(lowFreq / binSize);
        const highBin = Math.floor(highFreq / binSize);
        
        let energy = 0;
        for (let i = lowBin; i <= highBin && i < frequencyData.length; i++) {
            energy += frequencyData[i] * frequencyData[i];
        }
        
        return Math.sqrt(energy) / 255; // 정규화
    }
    
    /**
     * 비트 감지 (저주파 에너지 기반)
     */
    detectBeat(threshold = 0.3) {
        const bassEnergy = this.getFrequencyBandEnergy(20, 200); // 베이스 주파수 대역
        return bassEnergy > threshold;
    }
    
    /**
     * 오디오 종료 처리
     */
    handleAudioEnd() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        
        // 게임 완료 이벤트 발생
        const endEvent = new CustomEvent('audioEnd');
        document.dispatchEvent(endEvent);
        
        console.log('오디오 재생 완료');
    }
    
    /**
     * 샘플 오디오 생성 (테스트용)
     */
    createSampleAudio() {
        if (!this.audioContext) return null;
        
        // 간단한 비프음 생성
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 440; // A4 음
        gainNode.gain.value = 0.1;
        
        return { oscillator, gainNode };
    }
    
    /**
     * 효과음 재생
     */
    playSound(frequency, duration = 0.1, volume = 0.1) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * 리소스 정리
     */
    cleanup() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
            this.audioElement = null;
        }
        
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        
        this.isLoaded = false;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.duration = 0;
        this.proceduralMode = false;
        this.proceduralStartTime = 0;
    }
    
    /**
     * 프로시저럴 오디오 설정 (샘플 스테이지용)
     */
    setupProceduralAudio(duration = 30) {
        console.log('프로시저럴 오디오 설정 중...');
        
        // 가상의 오디오 상태 설정
        this.isLoaded = true;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.duration = duration;
        this.proceduralMode = true;
        
        // 프로시저럴 모드 시작 시간 설정
        this.proceduralStartTime = 0;
        
        console.log('프로시저럴 오디오 설정 완료, 길이:', duration + '초');
    }
    
    /**
     * 프로시저럴 오디오 재생 시작
     */
    startProceduralPlayback() {
        if (!this.proceduralMode) return;
        
        this.isPlaying = true;
        this.isPaused = false;
        this.proceduralStartTime = Date.now();
        
        // 프로시저럴 업데이트 루프 시작
        this.proceduralUpdateLoop();
        
        console.log('프로시저럴 오디오 재생 시작');
    }
    
    /**
     * 프로시저럴 오디오 업데이트 루프
     */
    proceduralUpdateLoop() {
        if (!this.proceduralMode || !this.isPlaying) return;
        
        // 현재 시간 업데이트
        const elapsed = (Date.now() - this.proceduralStartTime) / 1000;
        this.currentTime = elapsed;
        
        // 시간 로깅 (1초마다)
        if (Math.floor(this.currentTime) !== Math.floor(this.lastLoggedTime || 0)) {
            console.log('프로시더럴 오디오 시간:', this.currentTime.toFixed(2), '초');
            this.lastLoggedTime = this.currentTime;
        }
        
        // 종료 체크
        if (this.currentTime >= this.duration) {
            this.handleAudioEnd();
            return;
        }
        
        // 다음 프레임에서 계속
        requestAnimationFrame(() => this.proceduralUpdateLoop());
    }
    
    /**
     * 전체 리소스 정리
     */
    dispose() {
        this.cleanup();
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        console.log('오디오 매니저 리소스 정리 완료');
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}