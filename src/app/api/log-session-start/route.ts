import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

async function appendToSheet(sheetName: string, values: unknown[]) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!sheetId || !clientEmail || !privateKey) throw new Error('Google Sheets 인증 정보 누락');
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