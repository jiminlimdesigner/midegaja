// 세션 ID 생성 함수
const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${random}`.toUpperCase();
};

// 사용자 정보 인터페이스
interface UserInfo {
  id?: string;
  name?: string;
  device?: string;
  browser?: string;
  ip?: string;
}

// 세션 정보 인터페이스
interface SessionInfo {
  id?: string;
  subject: string;
  type: string;
  totalTime: number;
  startedAt?: number;
  endedAt?: number;
  stageTimes?: {
    sketch?: number;
    color?: number;
    detail?: number;
    organize?: number;
  };
}

// 단계 정보 인터페이스
interface StepInfo {
  name: string;
  duration: number;
  order: number;
  isCompleted: boolean;
}

// Slack 메시지 인터페이스
interface SlackMessage {
  text: string;
  username?: string;
  icon_emoji?: string;
  channel?: string;
}

// Slack Block 인터페이스
interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text: string;
  }>;
}

// Slack Payload 인터페이스
interface SlackPayload {
  text?: string;
  username?: string;
  icon_emoji?: string;
  channel?: string;
  blocks?: SlackBlock[];
  attachments?: Array<{
    color: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
  }>;
}

/**
 * 사용자 정보를 가져오는 함수
 */
const getUserInfo = (): UserInfo => {
  if (typeof window === 'undefined') return {};
  
  // 디바이스 타입 판별
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const deviceType = isMobile ? '모바일' : '데스크탑';
  
  return {
    device: deviceType,
    browser: navigator.userAgent.split(' ').pop()?.split('/')[0] || 'Unknown',
    // 추후 사용자 ID, IP 등은 서버에서 주입하거나 별도 API로 가져올 수 있음
  };
};

/**
 * 시간 포맷팅 함수 (요청된 포맷)
 */
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(/\. /g, '.').replace(/ /g, ' ');
};

/**
 * 시간을 시간:분 형식으로 변환
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

/**
 * 단계별 시간 설정을 문자열로 변환
 */
const formatStageTimes = (stageTimes?: SessionInfo['stageTimes']): string => {
  if (!stageTimes) return '자동 분배';
  
  const stages = [];
  if (stageTimes.sketch) stages.push(`스케치 ${Math.round(stageTimes.sketch * 60)}분`);
  if (stageTimes.color) stages.push(`채색 ${Math.round(stageTimes.color * 60)}분`);
  if (stageTimes.detail) stages.push(`묘사 ${Math.round(stageTimes.detail * 60)}분`);
  if (stageTimes.organize) stages.push(`정리 ${Math.round(stageTimes.organize * 60)}분`);
  
  return stages.join(' / ') || '자동 분배';
};

/**
 * Slack Webhook을 통해 메시지를 전송하는 함수
 * @param message - 전송할 메시지
 * @param options - 추가 옵션 (username, icon_emoji, channel 등)
 */
export const sendToSlack = async (
  message: string, 
  options: Partial<SlackMessage> = {}
): Promise<void> => {
  const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('Slack Webhook URL이 설정되지 않았습니다.');
    return;
  }

  try {
    const payload: SlackPayload = {
      text: message,
      username: options.username || '미대가자 봇',
      icon_emoji: options.icon_emoji || ':art:',
      channel: options.channel || '#실시간-채널'
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

    console.log('Slack 메시지 전송 성공:', message);
  } catch (error) {
    console.error('Slack 메시지 전송 중 오류:', error);
  }
};

/**
 * 고도화된 Slack 메시지 전송 함수 (Rich Format)
 */
export const sendRichSlackMessage = async (
  title: string,
  content: string,
  metadata?: {
    userInfo?: UserInfo;
    sessionInfo?: SessionInfo;
    stepInfo?: StepInfo;
    customFields?: Array<{ title: string; value: string; short?: boolean }>;
  },
  options: Partial<SlackMessage> = {}
): Promise<void> => {
  const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('Slack Webhook URL이 설정되지 않았습니다.');
    return;
  }

  try {
    const userInfo = metadata?.userInfo || getUserInfo();
    const sessionInfo = metadata?.sessionInfo;
    const stepInfo = metadata?.stepInfo;
    
    // 기본 필드 구성
    const fields: Array<{ title: string; value: string; short: boolean }> = [];
    
    // 사용자 정보 추가
    if (userInfo.device) {
      fields.push({ title: '기기', value: userInfo.device, short: true });
    }
    if (userInfo.browser) {
      fields.push({ title: '브라우저', value: userInfo.browser, short: true });
    }
    
    // 세션 정보 추가
    if (sessionInfo) {
      fields.push({ title: '주제', value: sessionInfo.subject, short: true });
      fields.push({ title: '유형', value: sessionInfo.type, short: true });
      fields.push({ title: '총 시간', value: formatDuration(sessionInfo.totalTime), short: true });
      if (sessionInfo.startedAt) {
        fields.push({ title: '시작 시간', value: formatTime(sessionInfo.startedAt), short: true });
      }
    }
    
    // 단계 정보 추가
    if (stepInfo) {
      fields.push({ title: '단계', value: stepInfo.name, short: true });
      fields.push({ title: '소요 시간', value: formatDuration(stepInfo.duration), short: true });
      fields.push({ title: '순서', value: `${stepInfo.order}/${4}`, short: true });
    }
    
    // 커스텀 필드 추가
    if (metadata?.customFields) {
      fields.push(...metadata.customFields.map(field => ({
        title: field.title,
        value: field.value,
        short: field.short ?? true
      })));
    }

    const payload: SlackPayload = {
      username: options.username || '미대가자 봇',
      icon_emoji: options.icon_emoji || ':art:',
      channel: options.channel || '#실시간-채널',
      attachments: [
        {
          color: '#36a64f', // 초록색
          fields: fields
        }
      ]
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

    console.log('Slack Rich 메시지 전송 성공:', title);
  } catch (error) {
    console.error('Slack Rich 메시지 전송 중 오류:', error);
  }
};

/**
 * 사용자 이벤트 로그를 전송하는 헬퍼 함수들 (기본 버전)
 */
export const logUserEvent = {
  // 세션 시작
  sessionStart: async (subject: string, type: string, totalTime: number) => {
    const message = `🎨 *세션 시작*\n• 주제: ${subject}\n• 유형: ${type}\n• 총 시간: ${Math.round(totalTime / 60)}분`;
    await sendToSlack(message);
  },

  // 단계 완료
  stepComplete: async (stepName: string, duration: number, subject: string) => {
    const message = `✅ *단계 완료*\n• 단계: ${stepName}\n• 소요 시간: ${Math.round(duration / 60)}분\n• 주제: ${subject}`;
    await sendToSlack(message);
  },

  // 세션 완료
  sessionComplete: async (subject: string, totalDuration: number, isOvertime: boolean) => {
    const status = isOvertime ? '⏰ 시간 초과 완료' : '🎉 정시 완료';
    const message = `${status}\n• 주제: ${subject}\n• 총 소요 시간: ${Math.round(totalDuration / 60)}분`;
    await sendToSlack(message);
  },

  // 세션 일시정지
  sessionPause: async (subject: string, currentStep: string, elapsedTime: number) => {
    const message = `⏸️ *세션 일시정지*\n• 주제: ${subject}\n• 현재 단계: ${currentStep}\n• 경과 시간: ${Math.round(elapsedTime / 60)}분`;
    await sendToSlack(message);
  },

  // 이미지 저장
  imageSave: async (subject: string, fileName: string) => {
    const message = `💾 *이미지 저장*\n• 주제: ${subject}\n• 파일명: ${fileName}`;
    await sendToSlack(message);
  },

  // 에러 발생
  error: async (error: string, context: string) => {
    const message = `❌ *에러 발생*\n• 컨텍스트: ${context}\n• 에러: ${error}`;
    await sendToSlack(message);
  }
};

/**
 * 새로운 포맷으로 사용자 이벤트 로그를 전송하는 헬퍼 함수들
 */
export const logUserEventNew = {
  // 세션 시작
  sessionStart: async (
    subject: string, 
    type: string, 
    totalTime: number,
    stageTimes?: SessionInfo['stageTimes'],
    startedAt?: number,
    userInfo?: UserInfo
  ) => {
    const sessionId = generateSessionId();
    const user = userInfo || getUserInfo();
    const timestamp = startedAt || Date.now();
    
    const message = `🟢 *세션 시작*\n📅 ${formatTime(timestamp)}\n📱 디바이스: ${user.device || '알 수 없음'}\n🧑‍🎨 사용자: unknown\n📝 주제: ${subject}\n🎨 유형: ${type}\n⏱ 전체 시간: ${formatDuration(totalTime * 60)}\n📍 설정: ${formatStageTimes(stageTimes)}\n\n🆔 세션 ID: \`${sessionId}\``;
    
    await sendToSlack(message);
    return sessionId;
  },

  // 세션 완료
  sessionComplete: async (
    subject: string, 
    totalDuration: number, 
    isOvertime: boolean,
    stepRecords: Array<{ name: string; duration: number }>,
    sessionId?: string,
    startedAt?: number,
    userInfo?: UserInfo
  ) => {
    const user = userInfo || getUserInfo();
    const timestamp = Date.now();
    const overtimeText = isOvertime ? ` (+${formatDuration(totalDuration - (totalDuration * 0.95))} 초과)` : '';
    
    // 단계별 소요 시간 문자열 생성
    const stepDetails = stepRecords
      .filter(step => step.duration > 0)
      .map(step => `- ${step.name}: ${formatDuration(step.duration)}`)
      .join('\n');
    
    const message = `🔴 *세션 종료*\n📅 ${formatTime(timestamp)}\n📱 디바이스: ${user.device || '알 수 없음'}\n🧑‍🎨 사용자: unknown\n📝 주제: ${subject}\n🕓 세션 전체 소요 시간: ${formatDuration(totalDuration)}${overtimeText}\n📍 단계별 소요\n${stepDetails}\n\n🆔 세션 ID: \`${sessionId || 'unknown'}\``;
    
    await sendToSlack(message);
  },

  // 에러 발생
  error: async (
    error: string, 
    context: string,
    userInfo?: UserInfo
  ) => {
    const user = userInfo || getUserInfo();
    const timestamp = Date.now();
    
    const message = `🚨 *에러 발생!*\n📅 ${formatTime(timestamp)}\n📱 디바이스: ${user.device || '알 수 없음'}\n🧑‍🎨 사용자: unknown (비로그인)\n🧭 위치: ${context}\n🧾 메시지: ${error}`;
    
    await sendToSlack(message);
  },

  // 단계 완료
  stepComplete: async (
    stepName: string, 
    duration: number, 
    subject: string,
    sessionId?: string,
    userInfo?: UserInfo
  ) => {
    const user = userInfo || getUserInfo();
    const timestamp = Date.now();
    
    const message = `✅ *단계 완료*\n📅 ${formatTime(timestamp)}\n📱 디바이스: ${user.device || '알 수 없음'}\n🧑‍🎨 사용자: unknown\n📝 주제: ${subject}\n🎯 단계: ${stepName}\n⏱ 소요 시간: ${formatDuration(duration)}\n\n🆔 세션 ID: \`${sessionId || 'unknown'}\``;
    
    await sendToSlack(message);
  },

  // 세션 일시정지
  sessionPause: async (
    subject: string, 
    currentStep: string, 
    elapsedTime: number,
    sessionId?: string,
    userInfo?: UserInfo
  ) => {
    const user = userInfo || getUserInfo();
    const timestamp = Date.now();
    
    const message = `⏸️ *세션 일시정지*\n📅 ${formatTime(timestamp)}\n📱 디바이스: ${user.device || '알 수 없음'}\n🧑‍🎨 사용자: unknown\n📝 주제: ${subject}\n🎯 현재 단계: ${currentStep}\n⏱ 경과 시간: ${formatDuration(elapsedTime)}\n\n🆔 세션 ID: \`${sessionId || 'unknown'}\``;
    
    await sendToSlack(message);
  },

  // 이미지 저장
  imageSave: async (
    subject: string, 
    fileName: string,
    sessionId?: string,
    userInfo?: UserInfo
  ) => {
    const user = userInfo || getUserInfo();
    const timestamp = Date.now();
    
    const message = `💾 *이미지 저장*\n📅 ${formatTime(timestamp)}\n📱 디바이스: ${user.device || '알 수 없음'}\n🧑‍🎨 사용자: unknown\n📝 주제: ${subject}\n📁 파일명: ${fileName}\n\n🆔 세션 ID: \`${sessionId || 'unknown'}\``;
    
    await sendToSlack(message);
  }
};

/**
 * 테스트용 메시지 전송
 */
export const sendTestMessage = async (): Promise<void> => {
  const message = `🧪 *테스트 메시지*\n• 시간: ${new Date().toLocaleString('ko-KR')}\n• 미대가자 서비스가 정상적으로 작동 중입니다.`;
  await sendToSlack(message);
}; 