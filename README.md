# 미대가자 (midegaja)

입시미술 실기 훈련을 위한 **단계별 타이머 기반 웹앱** MVP  
실시간 세션 기록, Slack 연동, GA4 이벤트 추적 등 실전 훈련에 최적화된 기능 제공  
향후 앱 출시 및 유료 모델 확장 예정

---

## 🖼️ 프로젝트 개요

- **목적**: 미술 입시생의 실기 훈련을 체계적으로 지원하는 웹앱 MVP
- **핵심 기능**:  
  - 단계별 타이머  
  - 세션 기록 저장(Google Sheets 연동 예정)  
  - 실시간 Slack 로그  
  - GA4 이벤트 추적  
- **확장 계획**:  
  - 앱 출시, 유료 모델, 통계/분석, 이미지 첨부 등

---

## 🛠️ 기술 스택

- **프레임워크**: Next.js (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS
- **상태 관리**: React 내장 상태
- **로그/통계**: Slack Webhook, Google Analytics 4(GA4)
- **기타**: Vercel 자동 배포, Bun 지원

---

## 🚀 실행 방법

1. **의존성 설치**
   ```bash
   npm install
   # 또는
   bun install
   ```

2. **환경 변수 설정**
   - 프로젝트 루트에 `.env.local` 파일 생성 후 아래 항목 추가
     ```env
     SLACK_WEBHOOK_URL_LOGGER=슬랙_세션_로그용_웹훅_URL
     SLACK_WEBHOOK_URL_ERROR=슬랙_에러_로그용_웹훅_URL
     # (Google Sheets, GA4 등 추가 예정)
     ```
   - Webhook URL은 외부에 노출되지 않도록 주의

3. **개발 서버 실행**
   ```bash
   npm run dev
   # 또는
   bun dev
   ```
   - [http://localhost:3000](http://localhost:3000) 접속

---

## 📁 주요 폴더 구조

- `src/app/`  
  - `page.tsx` : 메인 페이지  
  - `layout.tsx` : 전체 레이아웃  
  - `globals.css` : 전역 스타일  
  - `session-setup/` : 세션 설정 페이지  
  - `session-detail/` : 세션 결과/상세 페이지  
  - `timer/` : 단계별 타이머 페이지  
  - `test-slack/` : Slack 연동 테스트 페이지  
  - `api/` :  
    - `log-session-start/` : 세션 시작 로그 API  
    - `log-step-complete/` : 단계 완료 로그 API  
    - `unexpected-exit/` : 비정상 종료 로그 API  
    - `slack/` : Slack 메시지 전송 API  
- `src/components/`  
  - `GA4PageTracker.tsx` : GA4 페이지 추적  
  - `GTMScript.tsx`, `GTMNoScript.tsx` : GTM 스크립트  
  - `StepTip.tsx` : 단계별 팁 컴포넌트  
- `src/lib/ga.ts` : GA4 연동 함수  
- `src/shared/data/stepTips.ts` : 단계별 팁 데이터  
- `src/shared/utils/sendToSlack.ts` : Slack 전송 유틸  
- `src/shared/utils/tipUtils.ts` : 팁 관련 유틸

---

## ✅ 현재 구현된 기능

- [x] 세션 설정(주제, 유형, 시간 등)
- [x] 단계별 타이머 및 진행 상황 표시
- [x] 세션 결과/상세 페이지
- [x] Slack Webhook 연동 (실시간 로그)
- [x] GA4 페이지/이벤트 추적
- [x] Slack 연동 테스트 페이지(`/test-slack`)
- [x] 단계별 팁 제공
- [x] Vercel 자동 배포

---

## 🛠️ 향후 개발 예정 항목

- [ ] Google Sheets 연동(세션 기록 저장)
- [ ] 사용자 인증 및 식별(익명/로그인)
- [ ] 이미지 업로드 및 결과 저장
- [ ] 세션 통계/분석 대시보드
- [ ] 모바일 UX 개선
- [ ] 유료 모델(프리미엄 기능)
- [ ] 에러/예외 상황 Slack 알림 고도화
- [ ] 다양한 실기 유형/커스텀 단계 지원

---

## ⚠️ 사용 시 주의사항

- **환경 변수**
  - Slack Webhook, Google API Key 등 민감 정보는 `.env.local`에만 저장(절대 커밋 금지)
- **Google Analytics(GA4)**
  - 추적 ID/설정 필요, 실제 서비스 시 개인정보 처리방침 필수
- **Google Sheets 연동**
  - Google API Key, 시트 공유 권한 등 별도 설정 필요(추후 문서화 예정)
- **Vercel 배포**
  - `main` 브랜치에 push 시 자동 배포
- **보안**
  - Webhook, API Key 노출 시 즉시 폐기 및 재발급

---

이 문서는 MVP 기준이며, 코드/기능 추가 시 지속적으로 업데이트됩니다.  
(최종 수정: 2024-07-10 기준)

---
