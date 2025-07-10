# 📊 GA4(Google Analytics 4) 연동 가이드

## 개요

midegaja.com 웹사이트에 GA4를 연동하여 방문자 수, 유입 채널, 사용자 행동을 추적합니다.

## 설정 방법

### 1. GA4 측정 ID 발급

1. [Google Analytics](https://analytics.google.com/) 접속
2. 새 속성 생성 또는 기존 속성 선택
3. **관리** → **데이터 스트림** → **웹 스트림** 생성
4. 측정 ID 복사 (G-XXXXXXXXXX 형식)

### 2. 환경 변수 설정

#### 개발 환경 (`.env.local`)
```bash
# GA4 측정 ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# 기존 Slack Webhook URLs
SLACK_WEBHOOK_URL_LOGGER=https://hooks.slack.com/services/YOUR/SESSION/WEBHOOK
SLACK_WEBHOOK_URL_ERROR=https://hooks.slack.com/services/YOUR/ERROR/WEBHOOK
SLACK_WEBHOOK_URL_LOGGER_DEV=https://hooks.slack.com/services/YOUR/DEV/SESSION/WEBHOOK
SLACK_WEBHOOK_URL_ERROR_DEV=https://hooks.slack.com/services/YOUR/DEV/ERROR/WEBHOOK
```

#### 프로덕션 환경 (Vercel)
- Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
- `NEXT_PUBLIC_GA_ID` 추가 (Production 체크)

### 3. 테스트 방법

1. **페이지뷰 추적 확인:**
   - GA4 실시간 보고서에서 방문자 확인
   - 페이지 간 이동 시 page_view 이벤트 확인

2. **사용자 정의 이벤트 확인:**
   - 세션 시작/완료
   - 단계 완료
   - 이미지 저장
   - 에러 발생

## 구현된 기능

### ✅ 자동 추적
- **페이지뷰:** 모든 페이지 전환 자동 추적
- **실시간 방문자:** GA4 실시간 보고서에서 확인 가능

### ✅ 사용자 정의 이벤트
- `session_start`: 세션 시작
- `session_complete`: 세션 완료
- `step_complete`: 단계 완료
- `image_save`: 이미지 저장
- `error`: 에러 발생

### ✅ 이벤트 파라미터
각 이벤트에는 다음 정보가 포함됩니다:
- `session_id`: 세션 고유 ID
- `subject`: 주제
- `type`: 유형
- `total_time_minutes`: 총 시간 (분)
- `duration_minutes`: 소요 시간 (분)
- `is_overtime`: 시간 초과 여부
- `step_records`: 단계별 기록

## 파일 구조

```
src/
├── lib/
│   └── ga.ts                    # GA4 유틸리티 함수
├── components/
│   ├── GA4Script.tsx           # GA4 스크립트 로드
│   └── GA4PageTracker.tsx      # 페이지 라우팅 추적
├── app/
│   └── layout.tsx              # GA4 컴포넌트 포함
└── shared/utils/
    └── sendToSlack.ts          # GA4 이벤트 로깅 추가
```

## 사용법

### 기본 사용
```typescript
import { logEvent } from '@/lib/ga';

// 사용자 정의 이벤트 전송
logEvent('button_click', {
  button_name: 'start_session',
  page: 'home'
});
```

### Slack과 함께 사용
```typescript
import { logUserEventWithGA } from '@/shared/utils/sendToSlack';

// 세션 시작 (Slack + GA4 동시 전송)
await logUserEventWithGA.sessionStart('정물화', '사고의 전환', 7200);
```

## 확장 가능성

### React Native 확장 고려사항
- GA4 이벤트 구조를 모바일 환경에 맞게 확장 가능
- Firebase Analytics와 연동하여 크로스 플랫폼 추적 가능
- 동일한 이벤트명과 파라미터 구조 유지

### 추가 이벤트 예시
```typescript
// 사용자 등록
logEvent('user_signup', { method: 'email' });

// 결제 완료
logEvent('purchase', { 
  value: 29.99, 
  currency: 'USD',
  item_name: 'premium_subscription'
});

// 기능 사용
logEvent('feature_usage', { 
  feature_name: 'timer',
  usage_count: 1
});
```

## 주의사항

1. **개인정보 보호:** 개인 식별 정보는 전송하지 않음
2. **GDPR 준수:** 쿠키 동의 및 개인정보 처리방침 필요
3. **성능 최적화:** GA4 스크립트는 `afterInteractive` 전략으로 로드
4. **환경 분리:** 개발/프로덕션 환경별 이벤트 구분

## 문제 해결

### GA4 이벤트가 보이지 않는 경우
1. 측정 ID 확인
2. 환경 변수 설정 확인
3. 브라우저 개발자 도구에서 네트워크 요청 확인
4. GA4 실시간 보고서 확인

### 페이지뷰가 추적되지 않는 경우
1. `GA4PageTracker` 컴포넌트가 layout.tsx에 포함되어 있는지 확인
2. Next.js 라우터 변경 감지 확인
3. GA4 스크립트 로드 확인 