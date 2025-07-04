/**
 * 레벨 관리 클래스
 * 다양한 레벨 생성 및 관리
 */
class LevelManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.currentLevel = 1;
        this.maxLevel = 10;
        
        // 레벨 생성 함수들
        this.levelGenerators = [
            this.generateLevel1.bind(this),
            this.generateLevel2.bind(this),
            this.generateLevel3.bind(this),
            this.generateLevel4.bind(this),
            this.generateLevel5.bind(this),
            this.generateLevel6.bind(this),
            this.generateLevel7.bind(this),
            this.generateLevel8.bind(this),
            this.generateLevel9.bind(this),
            this.generateLevel10.bind(this)
        ];
    }
    
    /**
     * 현재 레벨 데이터 반환
     */
    getCurrentLevel() {
        const levelIndex = Math.min(this.currentLevel - 1, this.levelGenerators.length - 1);
        return this.levelGenerators[levelIndex]();
    }
    
    /**
     * 다음 레벨로 진행
     */
    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            return true;
        }
        return false; // 모든 레벨 완료
    }
    
    /**
     * 레벨 리셋
     */
    resetLevel() {
        this.currentLevel = 1;
    }
    
    /**
     * 레벨 1: 기본 튜토리얼
     */
    generateLevel1() {
        return {
            name: "레벨 1: 시작",
            startX: 100,
            startY: this.canvasHeight - 100,
            obstacles: [
                { x: 300, y: this.canvasHeight - 200, width: 20, height: 100 }
            ],
            goals: [
                { x: this.canvasWidth - 100, y: 100, radius: 30 }
            ],
            holes: []
        };
    }
    
    /**
     * 레벨 2: 구멍 피하기
     */
    generateLevel2() {
        return {
            name: "레벨 2: 구멍 피하기",
            startX: 100,
            startY: 100,
            obstacles: [
                { x: 200, y: 200, width: 150, height: 20 },
                { x: 450, y: 300, width: 150, height: 20 }
            ],
            goals: [
                { x: this.canvasWidth - 100, y: this.canvasHeight - 100, radius: 25 }
            ],
            holes: [
                { x: 300, y: 300, radius: 25 },
                { x: 500, y: 200, radius: 20 }
            ]
        };
    }
    
    /**
     * 레벨 3: 미로
     */
    generateLevel3() {
        return {
            name: "레벨 3: 미로",
            startX: 50,
            startY: 300,
            obstacles: [
                // 외벽
                { x: 100, y: 100, width: 20, height: 400 },
                { x: 120, y: 480, width: 560, height: 20 },
                { x: 660, y: 100, width: 20, height: 400 },
                { x: 120, y: 100, width: 560, height: 20 },
                
                // 내부 벽 (경로를 만들도록 재배치)
                { x: 200, y: 150, width: 20, height: 150 }, // 위쪽 벽 단축
                { x: 300, y: 250, width: 150, height: 20 }, // 중간 벽 단축
                { x: 480, y: 150, width: 20, height: 100 }, // 오른쪽 벽 단축
                { x: 350, y: 350, width: 150, height: 20 }  // 아래쪽 벽 재배치
            ],
            goals: [
                { x: 580, y: 180, radius: 25 } // 목표를 더 접근 가능한 위치로 이동
            ],
            holes: [
                { x: 250, y: 200, radius: 15 },
                { x: 400, y: 400, radius: 15 }
            ]
        };
    }
    
    /**
     * 레벨 4: 다중 목표
     */
    generateLevel4() {
        return {
            name: "레벨 4: 다중 목표",
            startX: this.canvasWidth / 2,
            startY: this.canvasHeight / 2,
            obstacles: [
                { x: 150, y: 150, width: 100, height: 20 },
                { x: 550, y: 150, width: 100, height: 20 },
                { x: 150, y: 430, width: 100, height: 20 },
                { x: 550, y: 430, width: 100, height: 20 }
            ],
            goals: [
                { x: 200, y: 100, radius: 20 },
                { x: 600, y: 100, radius: 20 },
                { x: 200, y: 500, radius: 20 },
                { x: 600, y: 500, radius: 20 }
            ],
            holes: [
                { x: 300, y: 200, radius: 18 },
                { x: 500, y: 200, radius: 18 },
                { x: 300, y: 400, radius: 18 },
                { x: 500, y: 400, radius: 18 }
            ]
        };
    }
    
    /**
     * 레벨 5: 좁은 통로
     */
    generateLevel5() {
        return {
            name: "레벨 5: 좁은 통로",
            startX: 50,
            startY: this.canvasHeight / 2,
            obstacles: [
                { x: 150, y: 0, width: 20, height: 250 },
                { x: 150, y: 350, width: 20, height: 250 },
                { x: 300, y: 150, width: 20, height: 200 },
                { x: 300, y: 450, width: 20, height: 150 },
                { x: 450, y: 0, width: 20, height: 200 },
                { x: 450, y: 400, width: 20, height: 200 },
                { x: 600, y: 100, width: 20, height: 300 }
            ],
            goals: [
                { x: this.canvasWidth - 50, y: this.canvasHeight / 2, radius: 25 }
            ],
            holes: [
                { x: 200, y: 300, radius: 12 },
                { x: 375, y: 250, radius: 12 },
                { x: 525, y: 350, radius: 12 }
            ]
        };
    }
    
    /**
     * 레벨 6: 플랫폼 점프
     */
    generateLevel6() {
        return {
            name: "레벨 6: 플랫폼",
            startX: 50,
            startY: this.canvasHeight - 50,
            obstacles: [
                // 플랫폼들
                { x: 150, y: this.canvasHeight - 100, width: 100, height: 20 },
                { x: 350, y: this.canvasHeight - 200, width: 100, height: 20 },
                { x: 550, y: this.canvasHeight - 150, width: 100, height: 20 },
                { x: 300, y: this.canvasHeight - 350, width: 200, height: 20 }
            ],
            goals: [
                { x: 400, y: this.canvasHeight - 400, radius: 25 }
            ],
            holes: [
                { x: 200, y: this.canvasHeight - 50, radius: 20 },
                { x: 400, y: this.canvasHeight - 50, radius: 20 },
                { x: 600, y: this.canvasHeight - 50, radius: 20 }
            ]
        };
    }
    
    /**
     * 레벨 7: 복잡한 미로
     */
    generateLevel7() {
        return {
            name: "레벨 7: 복잡한 미로",
            startX: 50,
            startY: 550,
            obstacles: [
                // 복잡한 미로 구조
                { x: 100, y: 100, width: 600, height: 20 },
                { x: 100, y: 100, width: 20, height: 200 },
                { x: 200, y: 180, width: 20, height: 120 },
                { x: 300, y: 120, width: 20, height: 100 },
                { x: 400, y: 180, width: 20, height: 120 },
                { x: 500, y: 120, width: 20, height: 180 },
                { x: 600, y: 180, width: 20, height: 120 },
                { x: 680, y: 100, width: 20, height: 400 },
                { x: 100, y: 480, width: 600, height: 20 },
                { x: 200, y: 360, width: 20, height: 120 },
                { x: 400, y: 360, width: 20, height: 120 },
                { x: 600, y: 360, width: 20, height: 120 }
            ],
            goals: [
                { x: 650, y: 350, radius: 20 }
            ],
            holes: [
                { x: 250, y: 400, radius: 15 },
                { x: 350, y: 250, radius: 15 },
                { x: 450, y: 400, radius: 15 },
                { x: 550, y: 250, radius: 15 }
            ]
        };
    }
    
    /**
     * 레벨 8: 타이밍 챌린지
     */
    generateLevel8() {
        return {
            name: "레벨 8: 타이밍",
            startX: 100,
            startY: 300,
            obstacles: [
                { x: 200, y: 0, width: 20, height: 150 },
                { x: 200, y: 250, width: 20, height: 150 },
                { x: 200, y: 450, width: 20, height: 150 },
                { x: 400, y: 100, width: 20, height: 150 },
                { x: 400, y: 350, width: 20, height: 150 },
                { x: 600, y: 0, width: 20, height: 200 },
                { x: 600, y: 400, width: 20, height: 200 }
            ],
            goals: [
                { x: 700, y: 300, radius: 25 }
            ],
            holes: [
                { x: 300, y: 175, radius: 18 },
                { x: 300, y: 425, radius: 18 },
                { x: 500, y: 275, radius: 18 },
                { x: 500, y: 525, radius: 18 }
            ]
        };
    }
    
    /**
     * 레벨 9: 정밀 조작
     */
    generateLevel9() {
        return {
            name: "레벨 9: 정밀 조작",
            startX: 50,
            startY: 300,
            obstacles: [
                // 좁은 지그재그 통로
                { x: 150, y: 0, width: 20, height: 280 },
                { x: 150, y: 320, width: 20, height: 280 },
                { x: 170, y: 260, width: 150, height: 20 },
                { x: 170, y: 320, width: 150, height: 20 },
                { x: 300, y: 140, width: 20, height: 140 },
                { x: 300, y: 320, width: 20, height: 140 },
                { x: 320, y: 120, width: 150, height: 20 },
                { x: 320, y: 460, width: 150, height: 20 },
                { x: 450, y: 120, width: 20, height: 120 },
                { x: 450, y: 460, width: 20, height: 120 },
                { x: 470, y: 360, width: 200, height: 20 },
                { x: 470, y: 220, width: 200, height: 20 }
            ],
            goals: [
                { x: 700, y: 290, radius: 20 }
            ],
            holes: [
                { x: 235, y: 290, radius: 12 },
                { x: 385, y: 190, radius: 12 },
                { x: 385, y: 390, radius: 12 },
                { x: 570, y: 290, radius: 12 }
            ]
        };
    }
    
    /**
     * 레벨 10: 최종 보스
     */
    generateLevel10() {
        return {
            name: "레벨 10: 최종 도전",
            startX: this.canvasWidth / 2,
            startY: this.canvasHeight - 50,
            obstacles: [
                // 외곽 벽
                { x: 50, y: 50, width: 700, height: 20 },
                { x: 50, y: 50, width: 20, height: 500 },
                { x: 730, y: 50, width: 20, height: 500 },
                { x: 50, y: 530, width: 700, height: 20 },
                
                // 내부 복잡한 구조
                { x: 150, y: 150, width: 20, height: 200 },
                { x: 250, y: 100, width: 20, height: 150 },
                { x: 350, y: 150, width: 20, height: 200 },
                { x: 450, y: 100, width: 20, height: 150 },
                { x: 550, y: 150, width: 20, height: 200 },
                { x: 630, y: 100, width: 20, height: 250 },
                
                { x: 100, y: 400, width: 100, height: 20 },
                { x: 250, y: 350, width: 100, height: 20 },
                { x: 400, y: 400, width: 100, height: 20 },
                { x: 550, y: 350, width: 100, height: 20 }
            ],
            goals: [
                { x: 150, y: 100, radius: 18 },
                { x: 300, y: 80, radius: 18 },
                { x: 500, y: 80, radius: 18 },
                { x: 680, y: 80, radius: 18 },
                { x: 400, y: 300, radius: 25 } // 중앙 최종 목표
            ],
            holes: [
                { x: 200, y: 200, radius: 15 },
                { x: 300, y: 300, radius: 15 },
                { x: 400, y: 200, radius: 15 },
                { x: 500, y: 300, radius: 15 },
                { x: 600, y: 200, radius: 15 },
                { x: 200, y: 450, radius: 15 },
                { x: 350, y: 480, radius: 15 },
                { x: 500, y: 450, radius: 15 }
            ]
        };
    }
    
    /**
     * 현재 레벨 번호 반환
     */
    getCurrentLevelNumber() {
        return this.currentLevel;
    }
    
    /**
     * 총 레벨 수 반환
     */
    getTotalLevels() {
        return this.maxLevel;
    }
    
    /**
     * 게임 완료 여부 확인
     */
    isGameComplete() {
        return this.currentLevel > this.maxLevel;
    }
}