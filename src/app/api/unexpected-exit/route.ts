import { NextRequest, NextResponse } from 'next/server';

// Google Sheets API 연동 유틸리티
import { google } from 'googleapis';

async function appendToSheet(sheetName: string, values: unknown[]) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!sheetId || !clientEmail || !privateKey) throw new Error('Google Sheets 인증 정보 누락');
    // 환경변수에서 \n → 실제 개행문자로 변환
    privateKey = privateKey.replace(/\\n/g, '\n');
    const jwt = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth: jwt });
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  } catch {
    console.warn('[Google Sheets 적재 실패]');
  }
}

export async function POST(req: NextRequest) {
  let data = null;
  try {
    data = await req.json();
    console.log('[unexpected-exit]', data);
  } catch {
    // 파싱 실패 시 무시
  }
  // Google Sheets 적재
  if (data && data.userId && data.sessionId) {
    const { userId, sessionId, currentStep, elapsed } = data;
    const timestamp = new Date().toISOString();
    appendToSheet('unexpected_exit', [timestamp, userId, sessionId, currentStep, elapsed]);
  }
  return NextResponse.json({ ok: true });
} 