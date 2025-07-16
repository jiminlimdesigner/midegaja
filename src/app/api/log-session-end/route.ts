import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId, endedAt, totalElapsed } = await req.json();
    // 서버 로그
    console.log('[session_end]', { userId, sessionId, endedAt, totalElapsed });
    // TODO: Google Sheets 적재 로직 추가 (기존 log-session-start 참고)
    // 예시: await appendToSheet({ userId, sessionId, endedAt, totalElapsed });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[log-session-end] 적재 실패', e);
    return NextResponse.json({ error: '적재 실패' }, { status: 500 });
  }
} 