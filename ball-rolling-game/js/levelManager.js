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
     * 레벨 6: 원형 트랙
     */
    generateLevel6() {
        return {
            name: "레벨 6: 원형 트랙",
            startX: 100,
            startY: 300,
            obstacles: [
                // 원형 트랙을 만드는 장애물들
                { x: 200, y: 150, width: 300, height: 20 },  // 상단
                { x: 200, y: 430, width: 300, height: 20 },  // 하단
                { x: 180, y: 170, width: 20, height: 260 },  // 왼쪽
                { x: 500, y: 170, width: 20, height: 260 },  // 오른쪽
                
                // 내부 원형 장애물
                { x: 280, y: 230, width: 140, height: 20 },  // 내부 상단
                { x: 280, y: 350, width: 140, height: 20 },  // 내부 하단
                { x: 260, y: 250, width: 20, height: 100 },  // 내부 왼쪽
                { x: 420, y: 250, width: 20, height: 100 },  // 내부 오른쪽
                
                // 진입/출구 통로
                { x: 50, y: 280, width: 130, height: 20 },   // 진입로 상단
                { x: 50, y: 320, width: 130, height: 20 },   // 진입로 하단
                { x: 520, y: 280, width: 130, height: 20 },  // 출구로 상단
                { x: 520, y: 320, width: 130, height: 20 }   // 출구로 하단
            ],
            goals: [
                { x: 700, y: 300, radius: 25 } // 출구 끝의 목표
            ],
            holes: [
                { x: 350, y: 200, radius: 18 }, // 상단 트랙의 함정
                { x: 230, y: 300, radius: 16 }, // 왼쪽 커브의 함정
                { x: 470, y: 300, radius: 16 }, // 오른쪽 커브의 함정
                { x: 350, y: 400, radius: 18 }, // 하단 트랙의 함정
                { x: 580, y: 300, radius: 14 }  // 출구 근처의 함정
            ]
        };
    }
    
    /**
     * 레벨 7: 다이아몬드 미로
     */
    generateLevel7() {
        return {
            name: "레벨 7: 다이아몬드 미로",
            startX: 50,
            startY: 300,
            obstacles: [
                // 다이아몬드 모양의 미로 구조
                // 외부 다이아몬드
                { x: 100, y: 280, width: 200, height: 20 },  // 왼쪽 상단
                { x: 100, y: 320, width: 200, height: 20 },  // 왼쪽 하단
                { x: 400, y: 280, width: 200, height: 20 },  // 오른쪽 상단
                { x: 400, y: 320, width: 200, height: 20 },  // 오른쪽 하단
                { x: 280, y: 100, width: 20, height: 200 },  // 상단 왼쪽
                { x: 320, y: 100, width: 20, height: 200 },  // 상단 오른쪽
                { x: 280, y: 400, width: 20, height: 200 },  // 하단 왼쪽
                { x: 320, y: 400, width: 20, height: 200 },  // 하단 오른쪽
                
                // 내부 복잡한 경로
                { x: 180, y: 200, width: 140, height: 15 },  // 내부 상단
                { x: 180, y: 385, width: 140, height: 15 },  // 내부 하단
                { x: 480, y: 200, width: 140, height: 15 },  // 내부 상단 오른쪽
                { x: 480, y: 385, width: 140, height: 15 },  // 내부 하단 오른쪽
                { x: 200, y: 220, width: 15, height: 160 },  // 내부 왼쪽 세로
                { x: 500, y: 220, width: 15, height: 160 },  // 내부 오른쪽 세로
                
                // 중앙 장애물
                { x: 350, y: 250, width: 20, height: 100 }   // 중앙 기둥
            ],
            goals: [
                { x: 700, y: 300, radius: 25 } // 출구
            ],
            holes: [
                { x: 150, y: 300, radius: 18 }, // 입구 근처
                { x: 250, y: 150, radius: 15 }, // 상단 경로
                { x: 250, y: 450, radius: 15 }, // 하단 경로
                { x: 450, y: 250, radius: 16 }, // 중간 경로
                { x: 550, y: 150, radius: 15 }, // 상단 오른쪽
                { x: 550, y: 450, radius: 15 }, // 하단 오른쪽
                { x: 360, y: 180, radius: 14 }, // 중앙 상단
                { x: 360, y: 420, radius: 14 }  // 중앙 하단
            ]
        };
    }
    
    /**
     * 레벨 8: 스프링 보드
     */
    generateLevel8() {
        return {
            name: "레벨 8: 스프링 보드",
            startX: 100,
            startY: this.canvasHeight - 100,
            obstacles: [
                // 스프링 보드처럼 보이는 구조들
                { x: 50, y: this.canvasHeight - 50, width: 120, height: 20 },   // 시작 플랫폼
                { x: 250, y: this.canvasHeight - 30, width: 60, height: 10 },   // 첫 번째 스프링보드
                { x: 200, y: this.canvasHeight - 120, width: 80, height: 15 },  // 첫 번째 착지점
                { x: 400, y: this.canvasHeight - 200, width: 80, height: 15 },  // 두 번째 착지점
                { x: 480, y: this.canvasHeight - 40, width: 60, height: 10 },   // 두 번째 스프링보드
                { x: 600, y: this.canvasHeight - 300, width: 80, height: 15 },  // 세 번째 착지점
                { x: 350, y: this.canvasHeight - 380, width: 80, height: 15 },  // 네 번째 착지점
                { x: 150, y: this.canvasHeight - 480, width: 100, height: 15 }, // 다섯 번째 착지점
                { x: 500, y: this.canvasHeight - 550, width: 150, height: 20 }, // 최종 플랫폼
                
                // 방해 장애물들
                { x: 320, y: this.canvasHeight - 160, width: 15, height: 80 },  // 중간 방해기둥
                { x: 280, y: this.canvasHeight - 320, width: 15, height: 100 }, // 상단 방해기둥
                { x: 450, y: this.canvasHeight - 420, width: 15, height: 120 }  // 고도 방해기둥
            ],
            goals: [
                { x: 575, y: this.canvasHeight - 600, radius: 30 } // 최상단 목표
            ],
            holes: [
                { x: 180, y: this.canvasHeight - 80, radius: 18 },  // 첫 번째 함정
                { x: 350, y: this.canvasHeight - 160, radius: 16 }, // 두 번째 함정
                { x: 530, y: this.canvasHeight - 120, radius: 20 }, // 세 번째 함정
                { x: 420, y: this.canvasHeight - 260, radius: 15 }, // 네 번째 함정
                { x: 200, y: this.canvasHeight - 350, radius: 17 }, // 다섯 번째 함정
                { x: 380, y: this.canvasHeight - 440, radius: 14 }, // 여섯 번째 함정
                { x: 450, y: this.canvasHeight - 520, radius: 16 }  // 최종 근처 함정
            ]
        };
    }
    
    /**
     * 레벨 9: 다중 목표 수집
     */
    generateLevel9() {
        return {
            name: "레벨 9: 다중 목표 수집",
            startX: this.canvasWidth / 2,
            startY: this.canvasHeight / 2,
            obstacles: [
                // 중앙에서 사방으로 뻗어나가는 구조
                { x: this.canvasWidth / 2 - 10, y: 0, width: 20, height: 200 },           // 북쪽 길
                { x: this.canvasWidth / 2 - 10, y: 400, width: 20, height: 200 },         // 남쪽 길
                { x: 0, y: this.canvasHeight / 2 - 10, width: 200, height: 20 },          // 서쪽 길
                { x: 400, y: this.canvasHeight / 2 - 10, width: 400, height: 20 },        // 동쪽 길
                
                // 각 방향의 방어 구조물
                { x: 150, y: 50, width: 100, height: 15 },   // 북서 장애물
                { x: 550, y: 50, width: 100, height: 15 },   // 북동 장애물
                { x: 150, y: 535, width: 100, height: 15 },  // 남서 장애물
                { x: 550, y: 535, width: 100, height: 15 },  // 남동 장애물
                
                // 대각선 경로 차단기
                { x: 250, y: 150, width: 15, height: 100 },  // 북서 차단기
                { x: 535, y: 150, width: 15, height: 100 },  // 북동 차단기
                { x: 250, y: 350, width: 15, height: 100 },  // 남서 차단기
                { x: 535, y: 350, width: 15, height: 100 },  // 남동 차단기
                
                // 중앙 보호 링
                { x: 320, y: 220, width: 160, height: 15 },  // 중앙 상단
                { x: 320, y: 365, width: 160, height: 15 },  // 중앙 하단
                { x: 305, y: 235, width: 15, height: 130 },  // 중앙 왼쪽
                { x: 480, y: 235, width: 15, height: 130 }   // 중앙 오른쪽
            ],
            goals: [
                { x: 100, y: 100, radius: 22 },  // 북서 목표
                { x: 700, y: 100, radius: 22 },  // 북동 목표
                { x: 100, y: 500, radius: 22 },  // 남서 목표
                { x: 700, y: 500, radius: 22 },  // 남동 목표
                { x: 400, y: 300, radius: 25 }   // 중앙 최종 목표 (모든 목표 수집 후)
            ],
            holes: [
                { x: 200, y: 200, radius: 16 },  // 북서 함정
                { x: 600, y: 200, radius: 16 },  // 북동 함정
                { x: 200, y: 400, radius: 16 },  // 남서 함정
                { x: 600, y: 400, radius: 16 },  // 남동 함정
                { x: 350, y: 250, radius: 12 },  // 중앙 상단 함정
                { x: 350, y: 350, radius: 12 },  // 중앙 하단 함정
                { x: 450, y: 250, radius: 12 },  // 중앙 상단 오른쪽 함정
                { x: 450, y: 350, radius: 12 }   // 중앙 하단 오른쪽 함정
            ]
        };
    }
    
    /**
     * 레벨 10: 챔피언의 시련
     */
    generateLevel10() {
        return {
            name: "레벨 10: 챔피언의 시련",
            startX: 100,
            startY: this.canvasHeight - 100,
            obstacles: [
                // 거대한 나선형 구조
                // 외부 경계
                { x: 50, y: 50, width: 700, height: 20 },   // 상단 경계
                { x: 50, y: 50, width: 20, height: 500 },   // 왼쪽 경계  
                { x: 730, y: 50, width: 20, height: 500 },  // 오른쪽 경계
                { x: 50, y: 530, width: 700, height: 20 },  // 하단 경계
                
                // 나선형 미로 구조 - 중심으로 향하는 길
                { x: 120, y: 120, width: 550, height: 20 }, // 첫 번째 링 상단
                { x: 120, y: 460, width: 550, height: 20 }, // 첫 번째 링 하단  
                { x: 120, y: 140, width: 20, height: 320 }, // 첫 번째 링 왼쪽
                { x: 650, y: 140, width: 20, height: 200 }, // 첫 번째 링 오른쪽 (일부)
                
                { x: 190, y: 190, width: 420, height: 20 }, // 두 번째 링 상단
                { x: 190, y: 390, width: 420, height: 20 }, // 두 번째 링 하단
                { x: 190, y: 210, width: 20, height: 180 }, // 두 번째 링 왼쪽
                { x: 590, y: 210, width: 20, height: 110 }, // 두 번째 링 오른쪽 (일부)
                
                { x: 260, y: 260, width: 280, height: 20 }, // 세 번째 링 상단
                { x: 260, y: 320, width: 280, height: 20 }, // 세 번째 링 하단
                { x: 260, y: 280, width: 20, height: 40 },  // 세 번째 링 왼쪽
                { x: 520, y: 280, width: 20, height: 40 },  // 세 번째 링 오른쪽
                
                // 최종 중앙 보스 방
                { x: 330, y: 240, width: 140, height: 15 }, // 보스방 상단
                { x: 330, y: 345, width: 140, height: 15 }, // 보스방 하단
                { x: 315, y: 255, width: 15, height: 90 },  // 보스방 왼쪽
                { x: 470, y: 255, width: 15, height: 50 },  // 보스방 오른쪽 (입구)
                
                // 추가 도전 요소들
                { x: 500, y: 380, width: 15, height: 80 },  // 하단 기둥
                { x: 280, y: 360, width: 15, height: 60 },  // 중간 기둥
                { x: 420, y: 420, width: 60, height: 15 },  // 하단 가로막이
                { x: 580, y: 340, width: 15, height: 120 }  // 오른쪽 세로막이
            ],
            goals: [
                // 단계별 목표들 - 순서대로 수집해야 함
                { x: 680, y: 100, radius: 20 },  // 첫 번째 목표 (외곽)
                { x: 150, y: 480, radius: 20 },  // 두 번째 목표 (왼쪽 하단)
                { x: 580, y: 250, radius: 20 },  // 세 번째 목표 (중간 오른쪽)
                { x: 220, y: 350, radius: 20 },  // 네 번째 목표 (중간 왼쪽)
                { x: 400, y: 290, radius: 30 }   // 최종 보스 목표 (중앙)
            ],
            holes: [
                // 전략적으로 배치된 함정들
                { x: 300, y: 150, radius: 18 },  // 외곽 함정 1
                { x: 500, y: 150, radius: 18 },  // 외곽 함정 2
                { x: 200, y: 250, radius: 16 },  // 중간 함정 1
                { x: 450, y: 180, radius: 16 },  // 중간 함정 2
                { x: 350, y: 430, radius: 17 },  // 하단 함정 1
                { x: 550, y: 430, radius: 17 },  // 하단 함정 2
                { x: 180, y: 320, radius: 15 },  // 왼쪽 함정
                { x: 620, y: 320, radius: 15 },  // 오른쪽 함정
                { x: 320, y: 350, radius: 14 },  // 보스방 근처 함정 1
                { x: 480, y: 230, radius: 14 },  // 보스방 근처 함정 2
                { x: 280, y: 200, radius: 13 },  // 정밀 함정 1
                { x: 520, y: 350, radius: 13 },  // 정밀 함정 2
                { x: 160, y: 400, radius: 16 },  // 경로 함정 1
                { x: 640, y: 200, radius: 16 }   // 경로 함정 2
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