# 센서 기반 게임 플랫폼 - 개발 기록

## 프로젝트 개요
모바일 센서(자이로스코프, 가속도계)를 활용한 실시간 게임 플랫폼입니다. WebSocket을 통해 휴대폰 센서 데이터를 수집하고, 다양한 게임에서 활용할 수 있습니다.

## 완성된 게임들

### 1. 볼 굴리기 게임 (ball-rolling-game/) - ✅ 완료
- **센서 기반 2D 물리 게임**
- **접속 경로**: `/ball-game` 또는 `/ball-rolling`
- **주요 기능**:
  - 10개 레벨 (튜토리얼 ~ 최종 보스)
  - 실시간 센서 기반 공 조작
  - 2D 물리 엔진 (중력, 충돌, 마찰)
  - 파티클 효과 시스템
  - Web Audio API 효과음
  - 시뮬레이션 모드 (WASD/화살표 키)

### 2. 3D 우주선 게임 (spaceship-game/) - ✅ 완료  
- **Three.js 기반 3D 게임**
- **접속 경로**: `/game` 또는 `/spaceship-game`
- **주요 기능**:
  - 3차원 우주 환경
  - 센서 기반 우주선 조작
  - 실시간 3D 렌더링

## 시스템 구성

### WebSocket 서버 (sensor-websocket-server.js)
- **포트**: HTTP(8080), HTTPS(8443)
- **기능**: 
  - 센서 데이터 실시간 수집/전송
  - 다중 게임 클라이언트 지원
  - 정적 파일 서빙
  - HTTPS 지원 (iOS 센서 권한)

### 센서 클라이언트 (sensor-client.html)
- 모바일 디바이스용 센서 데이터 송신기
- 자이로스코프, 가속도계, 방향 센서 수집
- WebSocket을 통한 실시간 데이터 전송

### 센서 대시보드 (sensor-dashboard.html)
- 실시간 센서 데이터 모니터링
- 다중 디바이스 연결 상태 확인
- 데이터 시각화

## 개발 완료 사항

### 볼 굴리기 게임 개발 과정
1. **게임 아키텍처 설계**
   - GameEngine: 2D Canvas 렌더링
   - BallPhysics: 물리 시뮬레이션 엔진
   - LevelManager: 10개 레벨 관리
   - SensorManager: 센서 데이터 처리

2. **물리 엔진 구현**
   - 중력, 마찰, 탄성 충돌
   - 원-사각형, 원-원 충돌 감지
   - 벽 충돌 처리

3. **레벨 디자인**
   - 10개 프로그레시브 레벨
   - 다양한 장애물과 목표
   - 구멍, 미로, 플랫폼 등

4. **센서 통합**
   - WebSocket 실시간 통신
   - 센서 데이터 스무싱
   - 자동 보정 시스템
   - 시뮬레이션 모드

5. **UI/UX 개선**
   - 반응형 디자인
   - 실시간 센서 상태 표시
   - 기울기 시각화

6. **오류 해결**
   - 404 스크립트 로딩 오류 수정
   - createRadialGradient NaN 오류 해결
   - deltaTime NaN 오류 수정
   - AudioContext autoplay 정책 대응
   - 레벨 3 미로 접근성 개선

## 기술적 성과

### 1. 2D 물리 엔진 구현
- 현실적인 중력과 마찰 시뮬레이션
- 정확한 충돌 감지 및 반응
- 부드러운 움직임과 반발

### 2. 센서 데이터 처리
- 실시간 센서 데이터 수집
- 노이즈 제거를 위한 데이터 스무싱
- 환경별 자동 보정

### 3. 게임 엔진 아키텍처
- 모듈화된 컴포넌트 설계
- 확장 가능한 레벨 시스템
- 재사용 가능한 물리 엔진

## 서버 시작 방법
```bash
npm start
```

## 게임 접속 URL
- 볼 굴리기 게임: http://localhost:8080/ball-game
- 3D 우주선 게임: http://localhost:8080/game
- 센서 대시보드: http://localhost:8080/sensor-dashboard.html
- 센서 클라이언트: http://localhost:8080/sensor-client.html

## 개발 환경
- **플랫폼**: Mac Book Pro M4 Pro (14core CPU, 20core GPU)
- **Node.js**: WebSocket 서버
- **브라우저**: Chrome, Safari (iOS HTTPS 필요)
- **도구**: Canvas API, Web Audio API, WebSocket

## 향후 확장 가능성
1. 추가 게임 타입 개발
2. 멀티플레이어 지원
3. 게임 데이터 저장/로드
4. 성취 시스템
5. 리더보드 기능

## 주의사항
- iOS에서 센서 권한 사용 시 HTTPS 필요
- Chrome autoplay 정책으로 인한 AudioContext 사용자 제스처 필요
- 센서 데이터 정확도는 디바이스에 따라 차이 있음