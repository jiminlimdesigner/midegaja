// GA4 이벤트 로깅 import
import { 
  logSessionStart as logGASessionStart, 
  logSessionComplete as logGASessionComplete, 
  logStepComplete as logGAStepComplete, 
  logImageSave as logGAImageSave, 
  logError as logGAError 
} from '@/lib/ga';

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

// Slack Payload 인터페이스


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
  try {
    const response = await fetch('/api/slack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message, 
        options: {
          ...options,
          username: options.username || '미대가자쌤',
          icon_emoji: options.icon_emoji || ':art:',
          // 채널을 지정하지 않으면 API에서 환경에 따라 자동으로 결정
          channel: options.channel
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Slack 전송 실패: ${response.status}`);
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

    const response = await fetch('/api/slack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
              body: JSON.stringify({
          message: `${title}\n${content}`,
          options: {
            ...options,
            username: options.username || '미대가자쌤',
            icon_emoji: options.icon_emoji || ':art:',
            // 채널을 지정하지 않으면 API에서 환경에 따라 자동으로 결정
            channel: options.channel,
            attachments: [
              {
                color: '#36a64f', // 초록색
                fields: fields
              }
            ]
          }
        }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Slack 전송 실패: ${response.status}`);
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
    await sendToSlack(message, { channel: '#logger-session' });
  },

  // 단계 완료
  stepComplete: async (stepName: string, duration: number, subject: string) => {
    const message = `✅ *${stepName} 단계 완료*\n• 단계: ${stepName}\n• 소요 시간: ${Math.round(duration / 60)}분\n• 주제: ${subject}`;
    await sendToSlack(message, { channel: '#logger-session' });
  },

  // 세션 완료
  sessionComplete: async (subject: string, totalDuration: number, isOvertime: boolean) => {
    const status = isOvertime ? '⏰ 시간 초과 완료' : '🎉 정시 완료';
    const message = `${status}\n• 주제: ${subject}\n• 총 소요 시간: ${Math.round(totalDuration / 60)}분`;
    await sendToSlack(message, { channel: '#logger-session' });
  },

  // 세션 일시정지
  sessionPause: async (subject: string, currentStep: string, elapsedTime: number) => {
    const message = `⏸️ *세션 일시정지*\n• 주제: ${subject}\n• 현재 단계: ${currentStep}\n• 경과 시간: ${Math.round(elapsedTime / 60)}분`;
    await sendToSlack(message, { channel: '#logger-session' });
  },

  // 이미지 저장
  imageSave: async (subject: string, fileName: string) => {
    const message = `💾 *이미지 저장*\n• 주제: ${subject}\n• 파일명: ${fileName}`;
    await sendToSlack(message, { channel: '#logger-session' });
  },

  // 에러 발생
  error: async (error: string, context: string) => {
    const message = `❌ *에러 발생*\n• 컨텍스트: ${context}\n• 에러: ${error}`;
    await sendToSlack(message, { channel: '#logger-error' });
  }
};

// 공통 정보 생성 함수
const getLogMeta = (sessionId?: string): string => {
  const user = getUserInfo();
  const id = sessionId || generateSessionId();
  const timestamp = formatTime(Date.now());
  return `세션 ID: ${id}\n디바이스: ${user.device || '알 수 없음'}\n사용자: unknown\n${timestamp}`;
};

/**
 * 새로운 포맷으로 사용자 이벤트 로그를 전송하는 헬퍼 함수들
 */
export const logUserEventNew = {
  sessionStart: async (
    subject: string, 
    type: string, 
    totalTime: number,
    stageTimes?: SessionInfo['stageTimes'],
    startedAt?: number,
    userInfo?: UserInfo,
    sessionId?: string
  ) => {
    const id = sessionId || generateSessionId();
    const meta = getLogMeta(id);
    const stageConfig = formatStageTimes(stageTimes);
    const message = `🎨 *세션 시작*
- 주제: ${subject}
- 유형: ${type}
- 전체 시간: ${Math.round(totalTime)}분
- 설정: ${stageConfig}

${meta}`;
    await sendToSlack(message);
    return id;
  },

  sessionComplete: async (
    subject: string, 
    totalDuration: number, 
    isOvertime: boolean,
    stepRecords: Array<{ name: string; duration: number }>,
    sessionId?: string
  ) => {
    const overtimeText = isOvertime ? `(+${Math.round((totalDuration - (totalDuration * 0.95)) / 60)}분)` : '';
    const steps = stepRecords
      .map(s => `${s.name}: ${Math.round(s.duration / 60)}분`)
      .join(' / ');
    const meta = getLogMeta(sessionId);
    const message = `:black_large_square: *세션 완료*
- 주제: ${subject}
- 소요 시간: ${Math.round(totalDuration / 60)}분 ${overtimeText}
- 단계별 시간: ${steps}

${meta}`;
    await sendToSlack(message);
  },

  stepComplete: async (
    stepName: string, 
    duration: number, 
    subject: string,
    sessionId?: string
  ) => {
    const meta = getLogMeta(sessionId);
    const message = `✅ *${stepName} 단계 완료*
- 주제: ${subject}
- 소요 시간: ${Math.round(duration / 60)}분

${meta}`;
    await sendToSlack(message);
  },

  sessionPause: async (
    subject: string, 
    currentStep: string, 
    elapsedTime: number,
    sessionId?: string
  ) => {
    const meta = getLogMeta(sessionId);
    const message = `⏸️ *세션 일시정지*
- 주제: ${subject}
- 현재 단계: ${currentStep}
- 경과 시간: ${Math.round(elapsedTime / 60)}분

${meta}`;
    await sendToSlack(message);
  },

  imageSave: async (
    subject: string, 
    fileName: string,
    sessionId?: string
  ) => {
    const meta = getLogMeta(sessionId);
    const message = `💾 *이미지 저장*
- 주제: ${subject}
- 파일명: ${fileName}

${meta}`;
    await sendToSlack(message);
  },

  error: async (
    error: string, 
    context: string,
    sessionId?: string
  ) => {
    const meta = getLogMeta(sessionId);
    const message = `🚨 *에러 발생!*
- 위치: ${context}
- 메시지: ${error}

${meta}`;
    await sendToSlack(message, { channel: '#logger-error' });
  }
};

/**
 * 테스트용 메시지 전송
 */
export const sendTestMessage = async (): Promise<void> => {
  const message = `🧪 *테스트 메시지*\n• 시간: ${new Date().toLocaleString('ko-KR')}\n• 미대가자 서비스가 정상적으로 작동 중입니다.`;
  await sendToSlack(message);
};

// GA4 이벤트 로깅 함수들 (Slack과 함께 사용)
export const logUserEventWithGA = {
  sessionStart: async (
    subject: string, 
    type: string, 
    totalTime: number,
    stageTimes?: SessionInfo['stageTimes'],
    startedAt?: number,
    userInfo?: UserInfo,
    sessionId?: string
  ) => {
    // Slack 로깅
    await logUserEventNew.sessionStart(subject, type, totalTime, stageTimes, startedAt, userInfo, sessionId);
    // GA4 로깅
    logGASessionStart(subject, type, totalTime);
  },

  sessionComplete: async (
    subject: string, 
    totalDuration: number, 
    isOvertime: boolean,
    stepRecords: Array<{ name: string; duration: number }>,
    sessionId?: string
  ) => {
    // Slack 로깅
    await logUserEventNew.sessionComplete(subject, totalDuration, isOvertime, stepRecords, sessionId);
    // GA4 로깅
    logGASessionComplete(subject, totalDuration, isOvertime, stepRecords);
  },

  stepComplete: async (
    stepName: string, 
    duration: number, 
    subject: string,
    sessionId?: string
  ) => {
    // Slack 로깅
    await logUserEventNew.stepComplete(stepName, duration, subject, sessionId);
    // GA4 로깅
    logGAStepComplete(stepName, duration, subject);
  },

  sessionPause: async (
    subject: string, 
    currentStep: string, 
    elapsedTime: number,
    sessionId?: string
  ) => {
    // Slack 로깅
    await logUserEventNew.sessionPause(subject, currentStep, elapsedTime, sessionId);
  },

  imageSave: async (
    subject: string, 
    fileName: string,
    sessionId?: string
  ) => {
    // Slack 로깅
    await logUserEventNew.imageSave(subject, fileName, sessionId);
    // GA4 로깅
    logGAImageSave(subject, fileName);
  },

  error: async (
    error: string, 
    context: string,
    sessionId?: string
  ) => {
    // Slack 로깅
    await logUserEventNew.error(error, context, sessionId);
    // GA4 로깅
    logGAError(error, context);
  }
}; 