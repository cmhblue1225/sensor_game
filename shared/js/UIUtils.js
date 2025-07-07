/**
 * 센서 게임 플랫폼 - UI 유틸리티 라이브러리
 * 모든 게임에서 공통으로 사용되는 UI 관련 유틸리티 함수들을 제공
 */
class UIUtils {
    /**
     * DOM 요소 안전하게 가져오기
     */
    static getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`요소를 찾을 수 없습니다: ${id}`);
        }
        return element;
    }
    
    /**
     * 여러 DOM 요소 안전하게 가져오기
     */
    static getElements(ids) {
        const elements = {};
        ids.forEach(id => {
            elements[id] = this.getElement(id);
        });
        return elements;
    }
    
    /**
     * 요소의 텍스트 안전하게 설정
     */
    static setText(elementId, text) {
        const element = this.getElement(elementId);
        if (element) {
            element.textContent = text;
        }
    }
    
    /**
     * 요소의 HTML 안전하게 설정
     */
    static setHTML(elementId, html) {
        const element = this.getElement(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }
    
    /**
     * 요소 표시/숨김
     */
    static show(elementId) {
        const element = this.getElement(elementId);
        if (element) {
            element.style.display = 'block';
        }
    }
    
    static hide(elementId) {
        const element = this.getElement(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }
    
    static toggle(elementId) {
        const element = this.getElement(elementId);
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    /**
     * 요소에 클래스 추가/제거
     */
    static addClass(elementId, className) {
        const element = this.getElement(elementId);
        if (element) {
            element.classList.add(className);
        }
    }
    
    static removeClass(elementId, className) {
        const element = this.getElement(elementId);
        if (element) {
            element.classList.remove(className);
        }
    }
    
    static toggleClass(elementId, className) {
        const element = this.getElement(elementId);
        if (element) {
            element.classList.toggle(className);
        }
    }
    
    /**
     * 센서 상태 표시 업데이트
     */
    static updateSensorStatus(isConnected, isSimulation = false) {
        const statusElement = this.getElement('sensorConnection');
        if (!statusElement) return;
        
        if (isConnected && !isSimulation) {
            statusElement.textContent = '📡 센서 연결됨';
            statusElement.style.color = '#4CAF50';
            statusElement.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        } else if (isSimulation) {
            statusElement.textContent = '⌨️ 시뮬레이션 모드';
            statusElement.style.color = '#FF9800';
            statusElement.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
        } else {
            statusElement.textContent = '📡 센서 연결 안됨';
            statusElement.style.color = '#f44336';
            statusElement.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
        }
    }
    
    /**
     * 센서 데이터 표시 업데이트
     */
    static updateSensorDisplay(sensorData, gameInput) {
        // 기울기 데이터 표시
        if (gameInput.x !== undefined && gameInput.y !== undefined) {
            this.setText('tiltX', (gameInput.x * 100).toFixed(1));
            this.setText('tiltY', (gameInput.y * 100).toFixed(1));
        }
        
        // 자세한 센서 데이터 표시 (있는 경우)
        if (sensorData.orientation) {
            this.setText('orientAlpha', sensorData.orientation.alpha.toFixed(1));
            this.setText('orientBeta', sensorData.orientation.beta.toFixed(1));
            this.setText('orientGamma', sensorData.orientation.gamma.toFixed(1));
        }
        
        if (sensorData.accelerometer) {
            this.setText('accelX', sensorData.accelerometer.x.toFixed(2));
            this.setText('accelY', sensorData.accelerometer.y.toFixed(2));
            this.setText('accelZ', sensorData.accelerometer.z.toFixed(2));
        }
        
        if (sensorData.gyroscope) {
            this.setText('gyroAlpha', sensorData.gyroscope.alpha.toFixed(2));
            this.setText('gyroBeta', sensorData.gyroscope.beta.toFixed(2));
            this.setText('gyroGamma', sensorData.gyroscope.gamma.toFixed(2));
        }
    }
    
    /**
     * 기울기 시각화 업데이트
     */
    static updateTiltVisualizer(gameInput) {
        const visualizer = this.getElement('tiltVisualizer');
        if (!visualizer) return;
        
        const indicator = visualizer.querySelector('.tilt-indicator');
        if (!indicator) return;
        
        const x = gameInput.x || 0;
        const y = gameInput.y || 0;
        
        // 시각화 컨테이너 크기
        const rect = visualizer.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // 기울기를 픽셀 위치로 변환
        const offsetX = x * (rect.width * 0.4);
        const offsetY = y * (rect.height * 0.4);
        
        // 인디케이터 위치 업데이트
        indicator.style.left = (centerX + offsetX - 10) + 'px';
        indicator.style.top = (centerY + offsetY - 10) + 'px';
        
        // 기울기 강도에 따른 색상 변경
        const intensity = Math.sqrt(x * x + y * y);
        const hue = Math.max(0, 120 - intensity * 120); // 녹색에서 빨간색으로
        indicator.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
    }
    
    /**
     * 점수 표시 업데이트 (애니메이션 포함)
     */
    static updateScore(elementId, newScore, animate = true) {
        const element = this.getElement(elementId);
        if (!element) return;
        
        const currentScore = parseInt(element.textContent) || 0;
        
        if (animate && newScore !== currentScore) {
            this.animateNumber(element, currentScore, newScore, 500);
        } else {
            element.textContent = newScore.toLocaleString();
        }
    }
    
    /**
     * 숫자 애니메이션
     */
    static animateNumber(element, startValue, endValue, duration) {
        const startTime = performance.now();
        const difference = endValue - startValue;
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // easeOutQuart 이징
            const easedProgress = 1 - Math.pow(1 - progress, 4);
            
            const currentValue = Math.round(startValue + difference * easedProgress);
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }
    
    /**
     * 프로그레스 바 업데이트
     */
    static updateProgressBar(elementId, value, maxValue, animated = true) {
        const element = this.getElement(elementId);
        if (!element) return;
        
        const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
        const bar = element.querySelector('.progress-fill') || element;
        
        if (animated) {
            bar.style.transition = 'width 0.3s ease';
        }
        
        bar.style.width = percentage + '%';
        
        // 색상 변경 (선택사항)
        if (percentage < 30) {
            bar.style.backgroundColor = '#f44336';
        } else if (percentage < 60) {
            bar.style.backgroundColor = '#FF9800';
        } else {
            bar.style.backgroundColor = '#4CAF50';
        }
    }
    
    /**
     * 토스트 메시지 표시
     */
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // 타입별 배경색
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#f44336'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // 자동 제거
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * 로딩 스피너 표시/숨김
     */
    static showLoading(elementId = 'loadingScreen') {
        this.show(elementId);
    }
    
    static hideLoading(elementId = 'loadingScreen') {
        this.hide(elementId);
    }
    
    /**
     * 모달 창 표시/숨김
     */
    static showModal(elementId) {
        const modal = this.getElement(elementId);
        if (modal) {
            modal.style.display = 'flex';
            modal.style.opacity = '0';
            
            requestAnimationFrame(() => {
                modal.style.transition = 'opacity 0.3s ease';
                modal.style.opacity = '1';
            });
        }
    }
    
    static hideModal(elementId) {
        const modal = this.getElement(elementId);
        if (modal) {
            modal.style.opacity = '0';
            
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * 버튼 상태 관리
     */
    static enableButton(elementId) {
        const button = this.getElement(elementId);
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    }
    
    static disableButton(elementId) {
        const button = this.getElement(elementId);
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.pointerEvents = 'none';
        }
    }
    
    /**
     * 화면 크기에 따른 반응형 처리
     */
    static updateResponsiveLayout() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 모바일 여부 확인
        const isMobile = screenWidth <= 768;
        
        // CSS 변수 업데이트
        document.documentElement.style.setProperty('--screen-width', screenWidth + 'px');
        document.documentElement.style.setProperty('--screen-height', screenHeight + 'px');
        document.documentElement.style.setProperty('--is-mobile', isMobile ? '1' : '0');
        
        // 모바일/데스크톱 클래스 토글
        if (isMobile) {
            document.body.classList.add('mobile');
            document.body.classList.remove('desktop');
        } else {
            document.body.classList.add('desktop');
            document.body.classList.remove('mobile');
        }
    }
    
    /**
     * 캔버스 크기 조정
     */
    static resizeCanvas(canvasId, maintainAspectRatio = true) {
        const canvas = this.getElement(canvasId);
        if (!canvas) return;
        
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        if (maintainAspectRatio) {
            const aspectRatio = 16 / 9; // 기본 비율
            let width = containerRect.width;
            let height = width / aspectRatio;
            
            if (height > containerRect.height) {
                height = containerRect.height;
                width = height * aspectRatio;
            }
            
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        } else {
            canvas.width = containerRect.width;
            canvas.height = containerRect.height;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }
    }
    
    /**
     * 풀스크린 토글
     */
    static toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('풀스크린 진입 실패:', err);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.warn('풀스크린 종료 실패:', err);
            });
        }
    }
    
    /**
     * 디바이스 방향 감지
     */
    static getDeviceOrientation() {
        if (screen.orientation) {
            return screen.orientation.type;
        } else if (window.orientation !== undefined) {
            return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
        }
        return 'unknown';
    }
    
    /**
     * 진동 효과 (모바일)
     */
    static vibrate(pattern = 100) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    /**
     * 사용자 제스처 대기 (오디오 자동재생 대응)
     */
    static waitForUserGesture() {
        return new Promise((resolve) => {
            const handleUserGesture = () => {
                document.removeEventListener('click', handleUserGesture);
                document.removeEventListener('touchstart', handleUserGesture);
                document.removeEventListener('keydown', handleUserGesture);
                resolve();
            };
            
            document.addEventListener('click', handleUserGesture);
            document.addEventListener('touchstart', handleUserGesture);
            document.addEventListener('keydown', handleUserGesture);
        });
    }
    
    /**
     * FPS 표시 업데이트
     */
    static updateFPS(fps) {
        const fpsElement = this.getElement('fpsCounter');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${fps.toFixed(1)}`;
            
            // FPS에 따른 색상 변경
            if (fps >= 50) {
                fpsElement.style.color = '#4CAF50';
            } else if (fps >= 30) {
                fpsElement.style.color = '#FF9800';
            } else {
                fpsElement.style.color = '#f44336';
            }
        }
    }
    
    /**
     * 성능 정보 표시
     */
    static updatePerformanceInfo(info) {
        if (info.memory) {
            this.setText('memoryUsage', `${(info.memory.usedJSHeapSize / 1048576).toFixed(1)} MB`);
        }
        
        if (info.timing) {
            this.setText('frameTime', `${info.timing.toFixed(2)} ms`);
        }
    }
    
    /**
     * 초기화 - 리사이즈 이벤트 등록
     */
    static init() {
        // 초기 레이아웃 업데이트
        this.updateResponsiveLayout();
        
        // 리사이즈 이벤트 리스너
        window.addEventListener('resize', () => {
            this.updateResponsiveLayout();
        });
        
        // 방향 변경 이벤트 리스너
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateResponsiveLayout();
            }, 100);
        });
        
        console.log('🎨 UI Utils 초기화 완료');
    }
}

// 페이지 로드 시 자동 초기화
if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UIUtils.init();
    });
} else if (typeof document !== 'undefined') {
    UIUtils.init();
}

// 모듈 내보내기 (ES6 모듈 방식)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIUtils;
}