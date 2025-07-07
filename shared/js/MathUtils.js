/**
 * 센서 게임 플랫폼 - 수학 유틸리티 라이브러리
 * 모든 게임에서 공통으로 사용되는 수학 함수들을 제공
 */
class MathUtils {
    /**
     * 값을 지정된 범위로 제한
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * 선형 보간
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * 역 선형 보간 (값에서 t 구하기)
     */
    static inverseLerp(a, b, value) {
        if (a === b) return 0;
        return (value - a) / (b - a);
    }
    
    /**
     * 값을 한 범위에서 다른 범위로 매핑
     */
    static map(value, fromMin, fromMax, toMin, toMax) {
        const t = this.inverseLerp(fromMin, fromMax, value);
        return this.lerp(toMin, toMax, t);
    }
    
    /**
     * 안전한 곱셈 (NaN, Infinity 방지)
     */
    static safeMultiply(a, b) {
        if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b)) {
            return 0;
        }
        return a * b;
    }
    
    /**
     * 안전한 덧셈 (NaN, Infinity 방지)
     */
    static safeAdd(a, b) {
        if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b)) {
            return 0;
        }
        return a + b;
    }
    
    /**
     * 안전한 나눗셈 (NaN, Infinity 방지)
     */
    static safeDivide(a, b) {
        if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b) || b === 0) {
            return 0;
        }
        return a / b;
    }
    
    /**
     * 극값 필터링
     */
    static filterExtreme(value, threshold = 1000) {
        if (Math.abs(value) > threshold) {
            return 0;
        }
        return value;
    }
    
    /**
     * 각도를 -180 ~ 180 범위로 정규화
     */
    static normalizeAngle(angle) {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }
    
    /**
     * 각도를 0 ~ 360 범위로 정규화
     */
    static normalizeAngle360(angle) {
        while (angle >= 360) angle -= 360;
        while (angle < 0) angle += 360;
        return angle;
    }
    
    /**
     * 도를 라디안으로 변환
     */
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * 라디안을 도로 변환
     */
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
    
    /**
     * 지수 감쇠 (스무딩에 유용)
     */
    static exponentialDecay(current, target, decay) {
        return current + (target - current) * (1 - Math.exp(-decay));
    }
    
    /**
     * 스무딩된 값 계산 (easing)
     */
    static smoothStep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }
    
    /**
     * 더 부드러운 스무딩 (smoother step)
     */
    static smootherStep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    /**
     * 탄성 이징 (elastic easing)
     */
    static elasticEaseOut(t) {
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    }
    
    /**
     * 바운스 이징 (bounce easing)
     */
    static bounceEaseOut(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
    
    /**
     * 거리 계산 (2D)
     */
    static distance2D(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 거리 계산 (3D)
     */
    static distance3D(x1, y1, z1, x2, y2, z2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * 벡터 정규화 (2D)
     */
    static normalize2D(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }
    
    /**
     * 벡터 정규화 (3D)
     */
    static normalize3D(x, y, z) {
        const length = Math.sqrt(x * x + y * y + z * z);
        if (length === 0) return { x: 0, y: 0, z: 0 };
        return { x: x / length, y: y / length, z: z / length };
    }
    
    /**
     * 벡터 내적 (2D)
     */
    static dot2D(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
    }
    
    /**
     * 벡터 내적 (3D)
     */
    static dot3D(x1, y1, z1, x2, y2, z2) {
        return x1 * x2 + y1 * y2 + z1 * z2;
    }
    
    /**
     * 벡터 외적 (2D, 스칼라 결과)
     */
    static cross2D(x1, y1, x2, y2) {
        return x1 * y2 - y1 * x2;
    }
    
    /**
     * 벡터 외적 (3D)
     */
    static cross3D(x1, y1, z1, x2, y2, z2) {
        return {
            x: y1 * z2 - z1 * y2,
            y: z1 * x2 - x1 * z2,
            z: x1 * y2 - y1 * x2
        };
    }
    
    /**
     * 원형 보간 (각도)
     */
    static lerpAngle(a, b, t) {
        const diff = this.normalizeAngle(b - a);
        return a + diff * t;
    }
    
    /**
     * 2D 회전 변환
     */
    static rotate2D(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: x * cos - y * sin,
            y: x * sin + y * cos
        };
    }
    
    /**
     * 이동 평균 계산
     */
    static movingAverage(values) {
        if (values.length === 0) return 0;
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum / values.length;
    }
    
    /**
     * 가중 평균 계산
     */
    static weightedAverage(values, weights) {
        if (values.length !== weights.length || values.length === 0) return 0;
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < values.length; i++) {
            weightedSum += values[i] * weights[i];
            totalWeight += weights[i];
        }
        
        return totalWeight === 0 ? 0 : weightedSum / totalWeight;
    }
    
    /**
     * 랜덤 정수 생성
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * 랜덤 실수 생성
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * 랜덤 불린 생성
     */
    static randomBool(probability = 0.5) {
        return Math.random() < probability;
    }
    
    /**
     * 배열에서 랜덤 요소 선택
     */
    static randomChoice(array) {
        if (array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * 가우시안 노이즈 생성 (Box-Muller 변환)
     */
    static gaussianNoise(mean = 0, stddev = 1) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return z * stddev + mean;
    }
    
    /**
     * 지수 이동 평균 (EMA)
     */
    static exponentialMovingAverage(current, newValue, alpha) {
        return alpha * newValue + (1 - alpha) * current;
    }
    
    /**
     * 칼만 필터 (1차원)
     */
    static kalmanFilter(estimate, measurement, processNoise, measurementNoise) {
        const kalmanGain = processNoise / (processNoise + measurementNoise);
        const updatedEstimate = estimate + kalmanGain * (measurement - estimate);
        const updatedProcessNoise = (1 - kalmanGain) * processNoise;
        
        return {
            estimate: updatedEstimate,
            processNoise: updatedProcessNoise
        };
    }
    
    /**
     * 원형 충돌 검사
     */
    static circleCollision(x1, y1, r1, x2, y2, r2) {
        const distance = this.distance2D(x1, y1, x2, y2);
        return distance < (r1 + r2);
    }
    
    /**
     * 사각형 충돌 검사 (AABB)
     */
    static rectangleCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    /**
     * 점이 사각형 내부에 있는지 검사
     */
    static pointInRectangle(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
    
    /**
     * 점이 원 내부에 있는지 검사
     */
    static pointInCircle(px, py, cx, cy, radius) {
        return this.distance2D(px, py, cx, cy) <= radius;
    }
}

// 모듈 내보내기 (ES6 모듈 방식)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathUtils;
}