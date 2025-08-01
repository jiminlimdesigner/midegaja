import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

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
    // 환경변수 디버깅 정보
    console.log('=== Slack API 디버깅 정보 ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('SLACK_WEBHOOK_URL_LOGGER:', process.env.SLACK_WEBHOOK_URL_LOGGER);
    console.log('SLACK_WEBHOOK_URL_ERROR:', process.env.SLACK_WEBHOOK_URL_ERROR);
    console.log('SLACK_WEBHOOK_URL_LOGGER_DEV:', process.env.SLACK_WEBHOOK_URL_LOGGER_DEV);
    console.log('SLACK_WEBHOOK_URL_ERROR_DEV:', process.env.SLACK_WEBHOOK_URL_ERROR_DEV);
    console.log('모든 환경변수 키:', Object.keys(process.env).filter(key => key.includes('SLACK')));
    
    const body = await request.json();
    const { message, options } = body;

    // 환경에 따라 기본 채널 결정
    const isDevelopment = process.env.NODE_ENV === 'development';
    const defaultChannel = isDevelopment ? '#logger-session-dev' : '#logger-session';
    const channel = options?.channel || defaultChannel;
    
    console.log('환경:', process.env.NODE_ENV);
    console.log('요청된 채널:', channel);
    console.log('기본 채널:', defaultChannel);
    
    // 환경과 채널에 따라 다른 Webhook URL 사용
    let webhookUrl: string | undefined;
    if (channel === '#logger-error') {
      webhookUrl = isDevelopment 
        ? process.env.SLACK_WEBHOOK_URL_ERROR_DEV 
        : process.env.SLACK_WEBHOOK_URL_ERROR;
      console.log(`${isDevelopment ? '개발' : '실서버'} 에러 채널 Webhook URL 사용`);
    } else if (channel === '#logger-session') {
      webhookUrl = process.env.SLACK_WEBHOOK_URL_LOGGER;
      console.log('실서버 세션 채널 Webhook URL 사용');
    } else if (channel === '#logger-session-dev') {
      webhookUrl = process.env.SLACK_WEBHOOK_URL_LOGGER_DEV;
      console.log('개발 세션 채널 Webhook URL 사용');
    } else {
      // 기본값 (개발 환경에서는 dev 채널로, 실서버에서는 일반 채널로)
      webhookUrl = isDevelopment 
        ? process.env.SLACK_WEBHOOK_URL_LOGGER_DEV 
        : process.env.SLACK_WEBHOOK_URL_LOGGER;
      console.log(`${isDevelopment ? '개발' : '실서버'} 기본 채널 Webhook URL 사용`);
    }
    
    console.log('선택된 Webhook URL 존재:', !!webhookUrl);
    
    if (!webhookUrl) {
      console.error('Webhook URL이 설정되지 않음');
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
      { 
        error: 'Slack 메시지 전송 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 