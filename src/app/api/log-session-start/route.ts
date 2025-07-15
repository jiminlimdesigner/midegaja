import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

async function appendToSheet(sheetName: string, values: unknown[]) {
  // 1. 환경변수 로그
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.SPREADSHEET_ID;
  console.log('[Google Sheets ENV]', { email, hasKey: !!key, spreadsheetId });

  try {
    // 2. JWT 인증 객체 생성 및 점검
    if (!email || !key || !spreadsheetId) {
      throw new Error('Google Sheets 환경변수 누락');
    }
    const jwt = new google.auth.JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // 3. Sheets API 파라미터 점검
    const sheets = google.sheets({ version: 'v4', auth: jwt });
    const params = {
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [values],
      },
    };
    console.log('[Google Sheets API Params]', params);
    // 4. API 호출 및 응답 로그
    const res = await sheets.spreadsheets.values.append(params);
    console.log('[Google Sheets 적재 성공]', res.status, res.statusText, res.data);
  } catch (e) {
    // 5. 에러 구조 상세 출력
    console.warn('[Google Sheets 적재 실패]', e);
    if (e instanceof Error) {
      console.warn('Error message:', e.message);
      // @ts-expect-error: Google API 응답 타입이 명확하지 않음
      if (e.response?.data) {
        // @ts-expect-error: Google API 응답 타입이 명확하지 않음
        console.warn('Error response data:', JSON.stringify(e.response.data));
      }
      // @ts-expect-error: Google API 에러 코드 타입 불명확
      if (e.code) {
        // @ts-expect-error: Google API 에러 코드 타입 불명확
        console.warn('Error code:', e.code);
      }
      // @ts-expect-error: Google API errors 필드 타입 불명확
      if (e.errors) {
        // @ts-expect-error: Google API errors 필드 타입 불명확
        console.warn('Error errors:', JSON.stringify(e.errors));
      }
    } else {
      console.warn('Unknown error type:', JSON.stringify(e));
    }
  }
}

export async function POST(req: NextRequest) {
  let data = null;
  try {
    data = await req.json();
    console.log('[session_log]', data);
  } catch {
    // 파싱 실패 시 무시
  }
  if (data && data.userId && data.sessionId) {
    const { userId, sessionId, subject, goalTime, startedAt } = data;
    const timestamp = new Date().toISOString();
    appendToSheet('session_log', [timestamp, userId, sessionId, subject, goalTime, startedAt]);
  }
  return NextResponse.json({ ok: true });
} 