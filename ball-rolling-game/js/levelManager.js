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
     * 레벨 3: 회전 플랫폼
     */
    generateLevel3() {
        return {
            name: "레벨 3: 회전 플랫폼",
            startX: 100,
            startY: this.canvasHeight - 100,
            obstacles: [
                // 중앙 회전 영역을 위한 고정 플랫폼들
                { x: 50, y: this.canvasHeight - 50, width: 100, height: 20 },  // 시작 플랫폼
                { x: 200, y: this.canvasHeight - 200, width: 80, height: 20 }, // 중간 플랫폼 1
                { x: 350, y: this.canvasHeight - 100, width: 80, height: 20 }, // 중간 플랫폼 2
                { x: 500, y: this.canvasHeight - 250, width: 80, height: 20 }, // 중간 플랫폼 3
                { x: 650, y: this.canvasHeight - 150, width: 100, height: 20 }, // 목표 근처 플랫폼
                
                // 벽들로 경로 제한
                { x: 0, y: 0, width: 20, height: this.canvasHeight },         // 왼쪽 벽
                { x: this.canvasWidth - 20, y: 0, width: 20, height: this.canvasHeight }, // 오른쪽 벽
                { x: 300, y: 0, width: 20, height: 300 },                     // 중앙 상단 벽
                { x: 400, y: 400, width: 20, height: 200 }                    // 중앙 하단 벽
            ],
            goals: [
                { x: this.canvasWidth - 80, y: 100, radius: 30 } // 상단 목표
            ],
            holes: [
                { x: 250, y: this.canvasHeight - 150, radius: 20 }, // 시작 근처 구멍
                { x: 400, y: this.canvasHeight - 180, radius: 18 }, // 중앙 구멍
                { x: 550, y: this.canvasHeight - 120, radius: 22 }, // 목표 근처 구멍
                { x: 320, y: 350, radius: 16 }                      // 상단 구멍
            ]
        };
    }
    
    /**
     * 레벨 4: 스윙 챌린지
     */
    generateLevel4() {
        return {
            name: "레벨 4: 스윙 챌린지",
            startX: 80,
            startY: this.canvasHeight - 80,
            obstacles: [
                // 진자 운동을 시뮬레이션하는 장애물들
                { x: 200, y: 0, width: 15, height: 350 },           // 긴 수직 장애물
                { x: 400, y: 250, width: 15, height: 350 },         // 중간 높이 장애물  
                { x: 600, y: 100, width: 15, height: 400 },         // 또 다른 긴 장애물
                
                // 플랫폼들
                { x: 50, y: this.canvasHeight - 50, width: 100, height: 20 },   // 시작 플랫폼
                { x: 250, y: this.canvasHeight - 150, width: 120, height: 20 }, // 첫 번째 착지 지점
                { x: 450, y: this.canvasHeight - 100, width: 120, height: 20 }, // 두 번째 착지 지점
                { x: 650, y: this.canvasHeight - 200, width: 100, height: 20 }  // 마지막 플랫폼
            ],
            goals: [
                { x: 700, y: this.canvasHeight - 250, radius: 25 }
            ],
            holes: [
                { x: 180, y: this.canvasHeight - 90, radius: 20 },  // 시작 근처
                { x: 380, y: this.canvasHeight - 50, radius: 22 },  // 중간 지점
                { x: 580, y: this.canvasHeight - 80, radius: 18 },  // 마지막 근처
                { x: 320, y: this.canvasHeight - 180, radius: 16 }  // 점프 지점
            ]
        };
    }
    
    /**
     * 레벨 5: 수직 클라이밍
     */
    generateLevel5() {
        return {
            name: "레벨 5: 수직 클라이밍",
            startX: 100,
            startY: this.canvasHeight - 50,
            obstacles: [
                // 계단식 플랫폼들 - 위로 올라가는 구조
                { x: 50, y: this.canvasHeight - 30, width: 100, height: 15 },   // 시작점
                { x: 200, y: this.canvasHeight - 100, width: 80, height: 15 },  // 첫 계단
                { x: 120, y: this.canvasHeight - 170, width: 80, height: 15 },  // 두 번째 계단 (왼쪽)
                { x: 300, y: this.canvasHeight - 240, width: 80, height: 15 },  // 세 번째 계단 (오른쪽)
                { x: 150, y: this.canvasHeight - 310, width: 80, height: 15 },  // 네 번째 계단 (왼쪽)
                { x: 350, y: this.canvasHeight - 380, width: 80, height: 15 },  // 다섯 번째 계단
                { x: 500, y: this.canvasHeight - 450, width: 80, height: 15 },  // 여섯 번째 계단
                { x: 600, y: this.canvasHeight - 520, width: 120, height: 15 }, // 최종 플랫폼
                
                // 방해 벽들
                { x: 320, y: this.canvasHeight - 150, width: 15, height: 100 }, // 중간 방해벽
                { x: 480, y: this.canvasHeight - 350, width: 15, height: 150 }  // 상단 방해벽
            ],
            goals: [
                { x: 660, y: this.canvasHeight - 570, radius: 25 } // 최상단 목표
            ],
            holes: [
                { x: 160, y: this.canvasHeight - 130, radius: 15 }, // 첫 번째 함정
                { x: 260, y: this.canvasHeight - 200, radius: 15 }, // 두 번째 함정
                { x: 190, y: this.canvasHeight - 270, radius: 15 }, // 세 번째 함정
                { x: 390, y: this.canvasHeight - 340, radius: 15 }, // 네 번째 함정
                { x: 540, y: this.canvasHeight - 410, radius: 15 }  // 다섯 번째 함정
            ]
        };
    }
    
    /**
     * 레벨 6: 정밀 조작
     */
    generateLevel6() {
        return {
            name: "레벨 6: 정밀 조작",
            startX: 80,
            startY: this.canvasHeight - 80,
            obstacles: [
                // 시작 플랫폼
                { x: 50, y: this.canvasHeight - 50, width: 100, height: 20 },
                
                // 좁은 통로 시스템 - 정밀한 조작 요구
                { x: 200, y: this.canvasHeight - 200, width: 15, height: 150 },  // 좁은 통로 입구 왼쪽
                { x: 280, y: this.canvasHeight - 200, width: 15, height: 150 },  // 좁은 통로 입구 오른쪽
                { x: 215, y: this.canvasHeight - 200, width: 65, height: 15 },   // 좁은 통로 상단
                { x: 215, y: this.canvasHeight - 65, width: 65, height: 15 },    // 좁은 통로 하단
                
                // 지그재그 경로
                { x: 350, y: this.canvasHeight - 180, width: 120, height: 15 },  // 지그재그 1
                { x: 400, y: this.canvasHeight - 140, width: 120, height: 15 },  // 지그재그 2
                { x: 350, y: this.canvasHeight - 100, width: 120, height: 15 },  // 지그재그 3
                
                // 정밀 점프 구간
                { x: 550, y: this.canvasHeight - 80, width: 40, height: 15 },    // 작은 플랫폼 1
                { x: 630, y: this.canvasHeight - 120, width: 40, height: 15 },   // 작은 플랫폼 2
                { x: 710, y: this.canvasHeight - 90, width: 40, height: 15 },    // 작은 플랫폼 3
                
                // 최종 도달 구간
                { x: 780, y: this.canvasHeight - 150, width: 60, height: 15 },   // 최종 플랫폼
                
                // 방해 기둥들
                { x: 320, y: this.canvasHeight - 250, width: 12, height: 50 },   // 방해 기둥 1
                { x: 450, y: this.canvasHeight - 160, width: 12, height: 50 },   // 방해 기둥 2
                { x: 600, y: this.canvasHeight - 200, width: 12, height: 50 }    // 방해 기둥 3
            ],
            goals: [
                { x: 810, y: this.canvasHeight - 200, radius: 25 } // 정밀하게 도달해야 하는 목표
            ],
            holes: [
                { x: 247, y: this.canvasHeight - 130, radius: 12 }, // 좁은 통로 내부 함정
                { x: 375, y: this.canvasHeight - 120, radius: 14 }, // 지그재그 함정 1
                { x: 425, y: this.canvasHeight - 160, radius: 14 }, // 지그재그 함정 2
                { x: 570, y: this.canvasHeight - 50, radius: 13 },  // 점프 구간 함정 1
                { x: 650, y: this.canvasHeight - 90, radius: 13 },  // 점프 구간 함정 2
                { x: 730, y: this.canvasHeight - 60, radius: 13 }   // 점프 구간 함정 3
            ]
        };
    }
    
    /**
     * 레벨 7: 시간 압박
     */
    generateLevel7() {
        return {
            name: "레벨 7: 시간 압박",
            startX: 100,
            startY: this.canvasHeight - 100,
            obstacles: [
                // 시작 플랫폼
                { x: 50, y: this.canvasHeight - 50, width: 120, height: 20 },
                
                // 빠른 경로 구성 - 연속된 플랫폼들
                { x: 200, y: this.canvasHeight - 120, width: 80, height: 15 },   // 플랫폼 1
                { x: 320, y: this.canvasHeight - 180, width: 80, height: 15 },   // 플랫폼 2
                { x: 450, y: this.canvasHeight - 240, width: 80, height: 15 },   // 플랫폼 3
                { x: 580, y: this.canvasHeight - 300, width: 80, height: 15 },   // 플랫폼 4
                { x: 450, y: this.canvasHeight - 360, width: 80, height: 15 },   // 플랫폼 5 (다시 왼쪽으로)
                { x: 320, y: this.canvasHeight - 420, width: 80, height: 15 },   // 플랫폼 6
                { x: 200, y: this.canvasHeight - 480, width: 80, height: 15 },   // 플랫폼 7
                { x: 350, y: this.canvasHeight - 540, width: 100, height: 20 },  // 최종 플랫폼
                
                // 방해 요소들 - 빠른 이동을 방해하는 장애물
                { x: 280, y: this.canvasHeight - 150, width: 20, height: 80 },   // 방해기둥 1
                { x: 520, y: this.canvasHeight - 270, width: 20, height: 80 },   // 방해기둥 2
                { x: 380, y: this.canvasHeight - 390, width: 20, height: 80 },   // 방해기둥 3
                { x: 150, y: this.canvasHeight - 450, width: 20, height: 80 },   // 방해기둥 4
                
                // 경로 제한 벽들
                { x: 0, y: 0, width: 20, height: this.canvasHeight },            // 왼쪽 벽
                { x: 780, y: 0, width: 20, height: this.canvasHeight },          // 오른쪽 벽
                { x: 20, y: 0, width: 760, height: 20 },                        // 상단 벽
                { x: 20, y: this.canvasHeight - 20, width: 760, height: 20 }    // 하단 벽
            ],
            goals: [
                { x: 400, y: this.canvasHeight - 590, radius: 30 } // 최상단 목표
            ],
            holes: [
                { x: 240, y: this.canvasHeight - 90, radius: 16 },  // 첫 번째 점프 함정
                { x: 360, y: this.canvasHeight - 150, radius: 16 }, // 두 번째 점프 함정
                { x: 490, y: this.canvasHeight - 210, radius: 16 }, // 세 번째 점프 함정
                { x: 620, y: this.canvasHeight - 270, radius: 16 }, // 네 번째 점프 함정
                { x: 490, y: this.canvasHeight - 330, radius: 16 }, // 다섯 번째 점프 함정
                { x: 360, y: this.canvasHeight - 390, radius: 16 }, // 여섯 번째 점프 함정
                { x: 240, y: this.canvasHeight - 450, radius: 16 }, // 일곱 번째 점프 함정
                { x: 300, y: this.canvasHeight - 510, radius: 14 }, // 최종 근처 함정 1
                { x: 450, y: this.canvasHeight - 510, radius: 14 }  // 최종 근처 함정 2
            ]
        };
    }
    
    /**
     * 레벨 8: 중력 변화
     */
    generateLevel8() {
        return {
            name: "레벨 8: 중력 변화",
            startX: 100,
            startY: this.canvasHeight - 100,
            obstacles: [
                // 시작 구역 (일반 중력)
                { x: 50, y: this.canvasHeight - 50, width: 150, height: 20 },
                
                // 중력 변화 구역을 나타내는 경계들
                // 구역 1: 낮은 중력 (위쪽)
                { x: 250, y: this.canvasHeight - 300, width: 200, height: 15 },  // 바닥
                { x: 230, y: this.canvasHeight - 320, width: 20, height: 320 },  // 왼쪽 벽
                { x: 450, y: this.canvasHeight - 320, width: 20, height: 320 },  // 오른쪽 벽
                { x: 250, y: this.canvasHeight - 320, width: 200, height: 15 },  // 천장
                
                // 구역 2: 강한 중력 (아래쪽)
                { x: 500, y: this.canvasHeight - 150, width: 150, height: 15 },  // 바닥
                { x: 480, y: this.canvasHeight - 200, width: 20, height: 200 },  // 왼쪽 벽
                { x: 650, y: this.canvasHeight - 200, width: 20, height: 200 },  // 오른쪽 벽
                { x: 500, y: this.canvasHeight - 200, width: 150, height: 15 },  // 천장
                
                // 구역 3: 역중력 (공중에 붙는 구역)
                { x: 150, y: this.canvasHeight - 450, width: 200, height: 15 },  // 바닥
                { x: 130, y: this.canvasHeight - 500, width: 20, height: 500 },  // 왼쪽 벽
                { x: 350, y: this.canvasHeight - 500, width: 20, height: 500 },  // 오른쪽 벽
                { x: 150, y: this.canvasHeight - 500, width: 200, height: 15 },  // 천장
                
                // 최종 구역: 일반 중력
                { x: 650, y: this.canvasHeight - 400, width: 120, height: 15 },  // 최종 플랫폼
                
                // 연결 통로들
                { x: 200, y: this.canvasHeight - 180, width: 80, height: 15 },   // 연결 통로 1
                { x: 420, y: this.canvasHeight - 250, width: 80, height: 15 },   // 연결 통로 2
                { x: 370, y: this.canvasHeight - 380, width: 80, height: 15 },   // 연결 통로 3
                { x: 550, y: this.canvasHeight - 320, width: 80, height: 15 },   // 연결 통로 4
                
                // 방해 기둥들
                { x: 320, y: this.canvasHeight - 280, width: 15, height: 60 },   // 중력 구역 내 기둥
                { x: 570, y: this.canvasHeight - 180, width: 15, height: 60 },   // 강중력 구역 내 기둥
                { x: 220, y: this.canvasHeight - 480, width: 15, height: 60 }    // 역중력 구역 내 기둥
            ],
            goals: [
                { x: 710, y: this.canvasHeight - 450, radius: 30 } // 최종 목표
            ],
            holes: [
                { x: 180, y: this.canvasHeight - 120, radius: 15 }, // 시작 구역 함정
                { x: 350, y: this.canvasHeight - 270, radius: 16 }, // 낮은 중력 구역 함정
                { x: 575, y: this.canvasHeight - 120, radius: 18 }, // 강한 중력 구역 함정
                { x: 240, y: this.canvasHeight - 420, radius: 15 }, // 역중력 구역 함정
                { x: 450, y: this.canvasHeight - 220, radius: 14 }, // 연결 통로 함정 1
                { x: 600, y: this.canvasHeight - 290, radius: 14 }, // 연결 통로 함정 2
                { x: 680, y: this.canvasHeight - 370, radius: 16 }  // 최종 근처 함정
            ]
        };
    }
    
    /**
     * 레벨 9: 복합 도전
     */
    generateLevel9() {
        return {
            name: "레벨 9: 복합 도전",
            startX: 100,
            startY: this.canvasHeight - 100,
            obstacles: [
                // 1단계: 정밀 조작 구간
                { x: 50, y: this.canvasHeight - 50, width: 100, height: 20 },          // 시작 플랫폼
                { x: 200, y: this.canvasHeight - 120, width: 15, height: 80 },         // 좁은 통로 1
                { x: 250, y: this.canvasHeight - 120, width: 15, height: 80 },         // 좁은 통로 2
                { x: 215, y: this.canvasHeight - 120, width: 35, height: 10 },         // 좁은 통로 상단
                
                // 2단계: 빠른 점프 구간
                { x: 320, y: this.canvasHeight - 180, width: 50, height: 10 },         // 작은 플랫폼 1
                { x: 410, y: this.canvasHeight - 220, width: 50, height: 10 },         // 작은 플랫폼 2
                { x: 500, y: this.canvasHeight - 160, width: 50, height: 10 },         // 작은 플랫폼 3
                { x: 590, y: this.canvasHeight - 240, width: 50, height: 10 },         // 작은 플랫폼 4
                
                // 3단계: 복잡한 미로 구간
                { x: 680, y: this.canvasHeight - 300, width: 120, height: 15 },        // 미로 입구
                { x: 760, y: this.canvasHeight - 450, width: 15, height: 450 },        // 미로 오른쪽 벽
                { x: 680, y: this.canvasHeight - 450, width: 15, height: 300 },        // 미로 왼쪽 벽
                { x: 680, y: this.canvasHeight - 450, width: 80, height: 15 },         // 미로 상단
                { x: 700, y: this.canvasHeight - 400, width: 40, height: 15 },         // 미로 중간 장애물 1
                { x: 720, y: this.canvasHeight - 360, width: 40, height: 15 },         // 미로 중간 장애물 2
                
                // 4단계: 수직 클라이밍 구간
                { x: 580, y: this.canvasHeight - 500, width: 80, height: 15 },         // 클라이밍 시작
                { x: 500, y: this.canvasHeight - 540, width: 60, height: 15 },         // 클라이밍 플랫폼 1
                { x: 420, y: this.canvasHeight - 580, width: 60, height: 15 },         // 클라이밍 플랫폼 2
                { x: 340, y: this.canvasHeight - 520, width: 60, height: 15 },         // 클라이밍 플랫폼 3
                { x: 260, y: this.canvasHeight - 560, width: 60, height: 15 },         // 클라이밍 플랫폼 4
                
                // 5단계: 최종 정밀 구간
                { x: 150, y: this.canvasHeight - 600, width: 80, height: 15 },         // 최종 플랫폼
                { x: 100, y: this.canvasHeight - 650, width: 15, height: 50 },         // 최종 좁은 통로 1
                { x: 160, y: this.canvasHeight - 650, width: 15, height: 50 },         // 최종 좁은 통로 2
                { x: 115, y: this.canvasHeight - 650, width: 45, height: 10 },         // 최종 좁은 통로 상단
                
                // 방해 기둥들
                { x: 380, y: this.canvasHeight - 200, width: 10, height: 40 },         // 점프 구간 방해기둥
                { x: 730, y: this.canvasHeight - 380, width: 10, height: 30 },         // 미로 내부 기둥
                { x: 460, y: this.canvasHeight - 560, width: 10, height: 40 },         // 클라이밍 구간 방해기둥
                { x: 300, y: this.canvasHeight - 540, width: 10, height: 40 }          // 클라이밍 구간 방해기둥 2
            ],
            goals: [
                { x: 137, y: this.canvasHeight - 700, radius: 25 } // 최상단 최종 목표
            ],
            holes: [
                { x: 232, y: this.canvasHeight - 90, radius: 12 },  // 정밀 조작 구간 함정
                { x: 345, y: this.canvasHeight - 150, radius: 14 }, // 점프 구간 함정 1
                { x: 435, y: this.canvasHeight - 190, radius: 14 }, // 점프 구간 함정 2
                { x: 525, y: this.canvasHeight - 130, radius: 14 }, // 점프 구간 함정 3
                { x: 615, y: this.canvasHeight - 210, radius: 14 }, // 점프 구간 함정 4
                { x: 720, y: this.canvasHeight - 330, radius: 15 }, // 미로 구간 함정 1
                { x: 710, y: this.canvasHeight - 420, radius: 15 }, // 미로 구간 함정 2
                { x: 530, y: this.canvasHeight - 510, radius: 16 }, // 클라이밍 구간 함정 1
                { x: 450, y: this.canvasHeight - 550, radius: 16 }, // 클라이밍 구간 함정 2
                { x: 370, y: this.canvasHeight - 490, radius: 16 }, // 클라이밍 구간 함정 3
                { x: 290, y: this.canvasHeight - 530, radius: 16 }, // 클라이밍 구간 함정 4
                { x: 190, y: this.canvasHeight - 570, radius: 15 }, // 최종 구간 함정 1
                { x: 130, y: this.canvasHeight - 620, radius: 12 }  // 최종 구간 함정 2
            ]
        };
    }
    
    /**
     * 레벨 10: 완벽한 실행
     */
    generateLevel10() {
        return {
            name: "레벨 10: 완벽한 실행",
            startX: 80,
            startY: this.canvasHeight - 80,
            obstacles: [
                // 시작 플랫폼 - 작은 시작점
                { x: 50, y: this.canvasHeight - 50, width: 60, height: 15 },
                
                // 1구간: 극도로 정밀한 좁은 통로
                { x: 150, y: this.canvasHeight - 120, width: 12, height: 100 },        // 좁은 통로 1
                { x: 190, y: this.canvasHeight - 120, width: 12, height: 100 },        // 좁은 통로 2
                { x: 162, y: this.canvasHeight - 120, width: 28, height: 8 },          // 좁은 통로 상단
                
                // 2구간: 극한 정밀 점프 (매우 작은 플랫폼들)
                { x: 250, y: this.canvasHeight - 150, width: 25, height: 8 },          // 미니 플랫폼 1
                { x: 310, y: this.canvasHeight - 190, width: 25, height: 8 },          // 미니 플랫폼 2
                { x: 370, y: this.canvasHeight - 230, width: 25, height: 8 },          // 미니 플랫폼 3
                { x: 430, y: this.canvasHeight - 270, width: 25, height: 8 },          // 미니 플랫폼 4
                { x: 490, y: this.canvasHeight - 310, width: 25, height: 8 },          // 미니 플랫폼 5
                
                // 3구간: 복잡한 지그재그 (완벽한 타이밍 필요)
                { x: 550, y: this.canvasHeight - 280, width: 40, height: 8 },          // 지그재그 1
                { x: 520, y: this.canvasHeight - 320, width: 40, height: 8 },          // 지그재그 2
                { x: 580, y: this.canvasHeight - 360, width: 40, height: 8 },          // 지그재그 3
                { x: 530, y: this.canvasHeight - 400, width: 40, height: 8 },          // 지그재그 4
                { x: 590, y: this.canvasHeight - 440, width: 40, height: 8 },          // 지그재그 5
                
                // 4구간: 극한 수직 클라이밍 (최소 실수 허용)
                { x: 480, y: this.canvasHeight - 480, width: 35, height: 8 },          // 클라이밍 1
                { x: 420, y: this.canvasHeight - 520, width: 35, height: 8 },          // 클라이밍 2
                { x: 360, y: this.canvasHeight - 560, width: 35, height: 8 },          // 클라이밍 3
                { x: 300, y: this.canvasHeight - 600, width: 35, height: 8 },          // 클라이밍 4
                { x: 240, y: this.canvasHeight - 640, width: 35, height: 8 },          // 클라이밍 5
                
                // 5구간: 최종 극한 정밀도 테스트
                { x: 150, y: this.canvasHeight - 680, width: 50, height: 8 },          // 최종 중간 플랫폼
                { x: 80, y: this.canvasHeight - 720, width: 10, height: 40 },          // 극한 좁은 통로 1
                { x: 120, y: this.canvasHeight - 720, width: 10, height: 40 },         // 극한 좁은 통로 2
                { x: 90, y: this.canvasHeight - 720, width: 30, height: 5 },           // 극한 좁은 통로 상단
                
                // 최종 도착 플랫폼
                { x: 70, y: this.canvasHeight - 760, width: 70, height: 15 },          // 최종 플랫폼
                
                // 완벽함을 방해하는 극소 방해 기둥들
                { x: 287, y: this.canvasHeight - 170, width: 6, height: 20 },          // 점프 구간 방해 1
                { x: 347, y: this.canvasHeight - 210, width: 6, height: 20 },          // 점프 구간 방해 2
                { x: 407, y: this.canvasHeight - 250, width: 6, height: 20 },          // 점프 구간 방해 3
                { x: 467, y: this.canvasHeight - 290, width: 6, height: 20 },          // 점프 구간 방해 4
                { x: 555, y: this.canvasHeight - 340, width: 6, height: 20 },          // 지그재그 구간 방해 1
                { x: 525, y: this.canvasHeight - 380, width: 6, height: 20 },          // 지그재그 구간 방해 2
                { x: 585, y: this.canvasHeight - 420, width: 6, height: 20 },          // 지그재그 구간 방해 3
                { x: 450, y: this.canvasHeight - 500, width: 6, height: 20 },          // 클라이밍 구간 방해 1
                { x: 390, y: this.canvasHeight - 540, width: 6, height: 20 },          // 클라이밍 구간 방해 2
                { x: 330, y: this.canvasHeight - 580, width: 6, height: 20 },          // 클라이밍 구간 방해 3
                { x: 270, y: this.canvasHeight - 620, width: 6, height: 20 }           // 클라이밍 구간 방해 4
            ],
            goals: [
                { x: 105, y: this.canvasHeight - 810, radius: 20 } // 최상단 최종 목표 - 매우 정밀한 위치
            ],
            holes: [
                // 극소 함정들 - 한 번의 실수도 용납하지 않음
                { x: 176, y: this.canvasHeight - 90, radius: 8 },   // 좁은 통로 함정
                { x: 275, y: this.canvasHeight - 120, radius: 10 }, // 점프 구간 함정 1
                { x: 335, y: this.canvasHeight - 160, radius: 10 }, // 점프 구간 함정 2
                { x: 395, y: this.canvasHeight - 200, radius: 10 }, // 점프 구간 함정 3
                { x: 455, y: this.canvasHeight - 240, radius: 10 }, // 점프 구간 함정 4
                { x: 515, y: this.canvasHeight - 280, radius: 10 }, // 점프 구간 함정 5
                { x: 545, y: this.canvasHeight - 300, radius: 9 },  // 지그재그 함정 1
                { x: 555, y: this.canvasHeight - 340, radius: 9 },  // 지그재그 함정 2
                { x: 525, y: this.canvasHeight - 380, radius: 9 },  // 지그재그 함정 3
                { x: 565, y: this.canvasHeight - 420, radius: 9 },  // 지그재그 함정 4
                { x: 535, y: this.canvasHeight - 460, radius: 9 },  // 지그재그 함정 5
                { x: 502, y: this.canvasHeight - 450, radius: 11 }, // 클라이밍 함정 1
                { x: 442, y: this.canvasHeight - 490, radius: 11 }, // 클라이밍 함정 2
                { x: 382, y: this.canvasHeight - 530, radius: 11 }, // 클라이밍 함정 3
                { x: 322, y: this.canvasHeight - 570, radius: 11 }, // 클라이밍 함정 4
                { x: 262, y: this.canvasHeight - 610, radius: 11 }, // 클라이밍 함정 5
                { x: 175, y: this.canvasHeight - 650, radius: 10 }, // 최종 중간 함정
                { x: 105, y: this.canvasHeight - 690, radius: 8 }   // 최종 극한 함정
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