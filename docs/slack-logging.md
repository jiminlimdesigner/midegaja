# 📦 Slack Logging Guide

## 채널 분리 기준

| 상황         | 채널            | 핵심 정보 요약                        |
|--------------|------------------|---------------------------------------|
| 세션 시작     | #logger-session  | 주제, 유형, 총 시간, 단계 설정       |
| 세션 완료     | #logger-session  | 총 소요 시간, 단계별 시간, 초과 여부 |
| 단계 완료     | #logger-session  | 단계명, 소요 시간                    |
| 세션 일시정지 | #logger-session  | 현재 단계, 경과 시간                 |
| 이미지 저장   | #logger-session  | 주제, 파일명                         |
| 에러 발생     | #logger-error    | 에러 메시지, 위치                   |

## 공통 포함 정보
- 세션 ID
- 디바이스 종류 (ex: 모바일(iPhone), 데스크탑(Mac))
- 사용자 ID (로그인 전까지는 `unknown`)
- 발생 시각 (yyyy.mm.dd hh:mm 형식)

## 사용 예시

```ts
// 세션 시작
const sessionId = await logUserEventNew.sessionStart('정물화', '사고의 전환', 7200);

// 단계 완료
await logUserEventNew.stepComplete('스케치', 1800, '정물화', sessionId);

// 세션 완료
await logUserEventNew.sessionComplete('정물화', 7200, false, [
  { name: '스케치', duration: 1800 },
  { name: '채색', duration: 2700 },
  { name: '묘사', duration: 1800 },
  { name: '정리', duration: 900 }
], sessionId);

// 에러 발생
await logUserEventNew.error('TypeError: undefined', 'Timer 페이지', sessionId);
```

## 메시지 포맷 예시

### 세션 시작
```
🎨 *세션 시작*
- 주제: 정물화
- 유형: 사고의 전환
- 전체 시간: 120분
- 설정: 스케치 30분 / 채색 45분 / 묘사 30분 / 정리 15분

세션 ID: SESSION_ABC123_DEF456
디바이스: 데스크탑
사용자: unknown
2025.01.15.오후 02:30
```

### 세션 완료
```
⬛ *세션 완료*
- 주제: 정물화
- 소요 시간: 120분
- 단계별 시간: 스케치: 30분 / 채색: 45분 / 묘사: 30분 / 정리: 15분

세션 ID: SESSION_ABC123_DEF456
디바이스: 데스크탑
사용자: unknown
2025.01.15.오후 04:30
```

### 에러 발생
```
🚨 *에러 발생!*
- 위치: Timer 페이지
- 메시지: TypeError: undefined

세션 ID: SESSION_ABC123_DEF456
디바이스: 데스크탑
사용자: unknown
2025.01.15.오후 03:15
```

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정해야 합니다:

```bash
# 세션 관련 로그용 Webhook URL
SLACK_WEBHOOK_SESSION_URL=https://hooks.slack.com/services/YOUR/SESSION/WEBHOOK

# 에러 로그용 Webhook URL
SLACK_WEBHOOK_ERROR_URL=https://hooks.slack.com/services/YOUR/ERROR/WEBHOOK
```

## 변경사항 요약

1. **슬랙 채널 분리**
   - `#logger-session`: 세션 관련 로깅 (시작, 완료, 일시정지, 단계 완료, 이미지 저장)
   - `#logger-error`: 에러 메시지 전용

2. **모든 메시지에 공통 정보 포함**
   - 세션 ID
   - 디바이스 종류
   - 사용자 ID (unknown)
   - 발생 시각 (formatTime())

3. **에러 및 세션 종료 메시지 시각적 강조**
   - 이모지 및 라인 구성 통일

4. **문서화 완료**
   - 채널 분리 기준, 메시지 구조, 예시까지 함께 정리 