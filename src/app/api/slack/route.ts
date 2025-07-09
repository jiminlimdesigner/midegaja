import { NextRequest, NextResponse } from 'next/server';

interface SlackPayload {
  text?: string;
  username?: string;
  icon_emoji?: string;
  channel?: string;
  attachments?: Array<{
    color: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, options } = body;

    const channel = options?.channel || '#logger-session';
    
    // 채널에 따라 다른 Webhook URL 사용
    let webhookUrl: string | undefined;
    if (channel === '#logger-error') {
      webhookUrl = process.env.SLACK_WEBHOOK_ERROR_URL;
    } else {
      webhookUrl = process.env.SLACK_WEBHOOK_SESSION_URL;
    }
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Slack Webhook URL이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const payload: SlackPayload = {
      text: message,
      username: options?.username || '미대가자쌤',
      icon_emoji: options?.icon_emoji || ':art:',
      channel: channel,
      attachments: options?.attachments
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack 전송 실패: ${response.status} ${response.statusText}`);
    }

    return NextResponse.json({ success: true, message: 'Slack 메시지 전송 성공' });
  } catch (error) {
    console.error('Slack 메시지 전송 중 오류:', error);
    return NextResponse.json(
      { error: 'Slack 메시지 전송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 