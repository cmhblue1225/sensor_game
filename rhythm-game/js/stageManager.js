/**
 * 스테이지 매니저 클래스
 * 스테이지 데이터 관리 및 로딩
 */
class StageManager {
    constructor() {
        this.stages = [];
        this.defaultStages = [];
        this.customStages = [];
        
        this.init();
    }
    
    /**
     * 스테이지 매니저 초기화
     */
    init() {
        this.createDefaultStages();
        this.loadCustomStages();
        this.mergeStages();
        
        console.log('스테이지 매니저 초기화 완료');
    }
    
    /**
     * 기본 스테이지 생성 (샘플 스테이지)
     */
    createDefaultStages() {
        // 샘플 스테이지 1: 간단한 패턴
        const sampleStage1 = {
            id: 'sample-1',
            title: '리듬 입문',
            artist: '시스템',
            difficulty: '쉬움',
            audioFile: null, // 실제 오디오 파일 없음 (프로시저럴 생성)
            bpm: 120,
            duration: 30,
            notes: this.generateSampleNotes(30, 120, 'easy'),
            locked: false,
            isDefault: true
        };
        
        // 샘플 스테이지 2: 중간 난이도
        const sampleStage2 = {
            id: 'sample-2',
            title: '리듬 연습',
            artist: '시스템',
            difficulty: '보통',
            audioFile: null,
            bpm: 140,
            duration: 45,
            notes: this.generateSampleNotes(45, 140, 'normal'),
            locked: false,
            isDefault: true
        };
        
        // 샘플 스테이지 3: 고급 패턴
        const sampleStage3 = {
            id: 'sample-3',
            title: '리듬 마스터',
            artist: '시스템',
            difficulty: '어려움',
            audioFile: null,
            bpm: 160,
            duration: 60,
            notes: this.generateSampleNotes(60, 160, 'hard'),
            locked: false,
            isDefault: true
        };
        
        this.defaultStages = [sampleStage1, sampleStage2, sampleStage3];
        
        console.log('기본 스테이지 생성 완료:', this.defaultStages.length + '개');
    }
    
    /**
     * 샘플 노트 생성
     */
    generateSampleNotes(duration, bpm, difficulty) {
        const notes = [];
        const beatInterval = 60 / bpm; // 비트 간격 (초)
        let noteId = 0;
        
        // 난이도별 설정
        const difficultySettings = {
            easy: { density: 0.5, variation: 0.1 },      // 2비트마다 1개, 적은 변화
            normal: { density: 0.75, variation: 0.3 },   // 1.33비트마다 1개, 중간 변화
            hard: { density: 1.0, variation: 0.5 }       // 매 비트마다, 많은 변화
        };
        
        const settings = difficultySettings[difficulty] || difficultySettings.normal;
        
        // 기본 비트 패턴 생성
        for (let time = 2; time < duration - 2; time += beatInterval / settings.density) {
            // 랜덤 변화 적용
            const variation = (Math.random() - 0.5) * settings.variation * beatInterval;
            const noteTime = time + variation;
            
            if (noteTime > 1 && noteTime < duration - 1) {
                notes.push({
                    id: noteId++,
                    time: noteTime,
                    intensity: 0.5 + Math.random() * 0.5, // 0.5 ~ 1.0
                    type: 'normal'
                });
            }
        }
        
        // 강조 노트 추가 (4박자마다)
        const measureInterval = beatInterval * 4;
        for (let time = 2; time < duration - 2; time += measureInterval) {
            if (Math.random() < 0.7) { // 70% 확률
                notes.push({
                    id: noteId++,
                    time: time,
                    intensity: 1.0,
                    type: 'accent'
                });
            }
        }
        
        // 시간순 정렬
        notes.sort((a, b) => a.time - b.time);
        
        console.log(`샘플 노트 생성 (${difficulty}):`, notes.length + '개');
        return notes;
    }
    
    /**
     * 커스텀 스테이지 로드
     */
    loadCustomStages() {
        try {
            const savedStages = localStorage.getItem('rhythm-game-custom-stages');
            if (savedStages) {
                this.customStages = JSON.parse(savedStages);
                console.log('커스텀 스테이지 로드 완료:', this.customStages.length + '개');
            }
        } catch (error) {
            console.error('커스텀 스테이지 로드 실패:', error);
            this.customStages = [];
        }
    }
    
    /**
     * 스테이지 목록 병합
     */
    mergeStages() {
        this.stages = [...this.defaultStages, ...this.customStages];
        
        // 잠금 상태 업데이트
        this.updateLockStatus();
        
        console.log('전체 스테이지 수:', this.stages.length);
    }
    
    /**
     * 잠금 상태 업데이트
     */
    updateLockStatus() {
        // 현재는 모든 스테이지 잠금 해제
        // 추후 진행도에 따른 잠금 시스템 구현 가능
        this.stages.forEach(stage => {
            stage.locked = false;
        });
    }
    
    /**
     * 모든 스테이지 반환
     */
    getAllStages() {
        return [...this.stages];
    }
    
    /**
     * ID로 스테이지 찾기
     */
    getStageById(id) {
        return this.stages.find(stage => stage.id === id);
    }
    
    /**
     * 스테이지 로드
     */
    async loadStage(stage) {
        try {
            // 기본 스테이지는 프로시저럴 오디오 생성
            if (stage.isDefault && !stage.audioFile) {
                console.log('프로시저럴 오디오 준비:', stage.title);
                // 실제 오디오 파일이 없으므로 메타데이터만 설정
                stage.duration = stage.duration || 30;
            }
            
            console.log('스테이지 로드 완료:', stage.title);
            return stage;
            
        } catch (error) {
            console.error('스테이지 로드 실패:', error);
            throw error;
        }
    }
    
    /**
     * 커스텀 스테이지 저장
     */
    saveCustomStage(stageData) {
        try {
            // 기존 스테이지 확인
            const existingIndex = this.customStages.findIndex(stage => stage.id === stageData.id);
            
            if (existingIndex >= 0) {
                // 기존 스테이지 업데이트
                this.customStages[existingIndex] = { ...stageData };
                console.log('스테이지 업데이트:', stageData.title);
            } else {
                // 새 스테이지 추가
                this.customStages.push({ ...stageData });
                console.log('새 스테이지 추가:', stageData.title);
            }
            
            // 로컬 스토리지에 저장
            localStorage.setItem('rhythm-game-custom-stages', JSON.stringify(this.customStages));
            
            // 스테이지 목록 재구성
            this.mergeStages();
            
            return true;
            
        } catch (error) {
            console.error('스테이지 저장 실패:', error);
            return false;
        }
    }
    
    /**
     * 스테이지 삭제
     */
    deleteStage(stageId) {
        try {
            // 기본 스테이지는 삭제 불가
            const stage = this.getStageById(stageId);
            if (stage && stage.isDefault) {
                console.warn('기본 스테이지는 삭제할 수 없습니다');
                return false;
            }
            
            // 커스텀 스테이지에서 제거
            this.customStages = this.customStages.filter(stage => stage.id !== stageId);
            
            // 로컬 스토리지 업데이트
            localStorage.setItem('rhythm-game-custom-stages', JSON.stringify(this.customStages));
            
            // 스테이지 목록 재구성
            this.mergeStages();
            
            console.log('스테이지 삭제 완료:', stageId);
            return true;
            
        } catch (error) {
            console.error('스테이지 삭제 실패:', error);
            return false;
        }
    }
    
    /**
     * 스테이지 유효성 검사
     */
    validateStage(stageData) {
        const errors = [];
        
        // 필수 필드 확인
        if (!stageData.id) errors.push('스테이지 ID가 필요합니다');
        if (!stageData.title) errors.push('스테이지 제목이 필요합니다');
        if (!stageData.artist) errors.push('아티스트명이 필요합니다');
        if (!stageData.notes || stageData.notes.length === 0) {
            errors.push('노트 데이터가 필요합니다');
        }
        
        // 노트 데이터 검증
        if (stageData.notes) {
            stageData.notes.forEach((note, index) => {
                if (typeof note.time !== 'number') {
                    errors.push(`노트 ${index + 1}: 시간 값이 유효하지 않습니다`);
                }
                if (typeof note.intensity !== 'number' || note.intensity < 0 || note.intensity > 1) {
                    errors.push(`노트 ${index + 1}: 강도 값이 유효하지 않습니다 (0-1)`);
                }
            });
        }
        
        return errors;
    }
    
    /**
     * 스테이지 내보내기 (JSON)
     */
    exportStage(stageId) {
        const stage = this.getStageById(stageId);
        if (!stage) {
            console.error('스테이지를 찾을 수 없습니다:', stageId);
            return null;
        }
        
        // 민감한 정보 제거
        const exportData = {
            id: stage.id,
            title: stage.title,
            artist: stage.artist,
            difficulty: stage.difficulty,
            bpm: stage.bpm,
            duration: stage.duration,
            notes: stage.notes,
            metadata: {
                created: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * 스테이지 가져오기 (JSON)
     */
    importStage(jsonData) {
        try {
            const stageData = JSON.parse(jsonData);
            
            // 유효성 검사
            const errors = this.validateStage(stageData);
            if (errors.length > 0) {
                throw new Error('스테이지 데이터 오류: ' + errors.join(', '));
            }
            
            // ID 중복 확인
            if (this.getStageById(stageData.id)) {
                stageData.id = stageData.id + '-imported-' + Date.now();
            }
            
            // 커스텀 스테이지로 추가
            stageData.isDefault = false;
            stageData.locked = false;
            
            return this.saveCustomStage(stageData);
            
        } catch (error) {
            console.error('스테이지 가져오기 실패:', error);
            return false;
        }
    }
    
    /**
     * 스테이지 통계
     */
    getStageStats() {
        const stats = {
            total: this.stages.length,
            default: this.defaultStages.length,
            custom: this.customStages.length,
            locked: this.stages.filter(stage => stage.locked).length,
            difficulties: {}
        };
        
        // 난이도별 통계
        this.stages.forEach(stage => {
            const difficulty = stage.difficulty || '미분류';
            stats.difficulties[difficulty] = (stats.difficulties[difficulty] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * 스테이지 검색
     */
    searchStages(query) {
        const lowerQuery = query.toLowerCase();
        
        return this.stages.filter(stage => {
            return stage.title.toLowerCase().includes(lowerQuery) ||
                   stage.artist.toLowerCase().includes(lowerQuery) ||
                   stage.difficulty.toLowerCase().includes(lowerQuery);
        });
    }
    
    /**
     * 난이도별 스테이지 필터링
     */
    getStagesByDifficulty(difficulty) {
        return this.stages.filter(stage => stage.difficulty === difficulty);
    }
    
    /**
     * 랜덤 스테이지 선택
     */
    getRandomStage(excludeLocked = true) {
        let availableStages = this.stages;
        
        if (excludeLocked) {
            availableStages = this.stages.filter(stage => !stage.locked);
        }
        
        if (availableStages.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * availableStages.length);
        return availableStages[randomIndex];
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        console.log('스테이지 매니저 리소스 정리 완료');
    }
}

// 전역 접근을 위한 export
if (typeof window !== 'undefined') {
    window.StageManager = StageManager;
}