This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# midegaja

미술 입시 도우미 웹 애플리케이션

## 기능

- 🎨 **세션 설정**: 주제, 유형, 시간 설정
- ⏱️ **타이머**: 단계별 진행 상황 추적
- 📊 **세션 결과**: 완료된 세션 결과 확인 및 이미지 저장
- 📱 **실시간 로그**: Slack 연동을 통한 사용자 행동 추적

## Slack 연동 설정

### 1. Slack Webhook 설정
1. Slack 워크스페이스에서 앱 생성
2. Incoming Webhooks 활성화
3. Webhook URL 복사

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
NEXT_PUBLIC_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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
```

### 3. 테스트
`/test-slack` 페이지에서 Slack 연동을 테스트할 수 있습니다.

### 4. 로그 형식

#### 기본 형식
- 간단한 텍스트 메시지로 전송
- 이모지와 기본 정보 포함

#### 새로운 포맷 (2025.07.10 기준)
- 세션별 고유 ID로 시작-종료 연결
- 상세한 사용자 정보 (디바이스, 브라우저)
- 단계별 시간 설정 및 소요 시간
- 에러 발생 시 상세 컨텍스트 정보

**예시 메시지:**
```
🟢 *세션 시작*
📅 2025.07.10 05:44
📱 디바이스: 모바일
🧑‍🎨 사용자: unknown
📝 주제: 핸드크림과 빨대
🎨 유형: 정물수채화
⏱ 전체 시간: 2시간
📍 설정: 스케치 30분 / 채색 45분 / 묘사 30분 / 정리 15분

🆔 세션 ID: `SESSION_ABC123`
```

### 5. 확장 가능한 구조
- 사용자 ID, IP 주소 등 추가 가능
- 이미지 첨부 기능 확장 가능
- 실시간 통계 및 분석 데이터 추가 가능
- 세션 ID를 통한 연관 이벤트 추적 가능

## 개발 서버 실행

```bash
bun dev
```

## 배포

Vercel을 통해 자동 배포됩니다.
