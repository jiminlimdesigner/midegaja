// Google Analytics 4 유틸리티 함수들

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// GA4 측정 ID
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// GA4 초기화
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_ID) {
    // GA4 스크립트가 이미 로드되었는지 확인
    if (typeof window.gtag === 'function') {
      return;
    }

    // GA4 스크립트 로드
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // gtag 함수 초기화
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    // GA4 초기화
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// 페이지뷰 이벤트 전송
export const pageview = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('config', GA_ID, {
      page_path: url,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }
};

// 사용자 정의 이벤트 전송
export const logEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// 세션 시작 이벤트
export const logSessionStart = (subject: string, type: string, totalTime: number) => {
  logEvent('session_start', {
    subject,
    type,
    total_time_minutes: Math.round(totalTime / 60),
    session_id: generateSessionId(),
  });
};

// 세션 완료 이벤트
export const logSessionComplete = (
  subject: string, 
  totalDuration: number, 
  isOvertime: boolean,
  stepRecords: Array<{ name: string; duration: number }>
) => {
  logEvent('session_complete', {
    subject,
    total_duration_minutes: Math.round(totalDuration / 60),
    is_overtime: isOvertime,
    step_records: stepRecords.map(s => ({
      name: s.name,
      duration_minutes: Math.round(s.duration / 60)
    })),
    session_id: generateSessionId(),
  });
};

// 단계 완료 이벤트
export const logStepComplete = (stepName: string, duration: number, subject: string) => {
  logEvent('step_complete', {
    step_name: stepName,
    duration_minutes: Math.round(duration / 60),
    subject,
    session_id: generateSessionId(),
  });
};

// 이미지 저장 이벤트
export const logImageSave = (subject: string, fileName: string) => {
  logEvent('image_save', {
    subject,
    file_name: fileName,
    session_id: generateSessionId(),
  });
};

// 에러 이벤트
export const logError = (error: string, context: string) => {
  logEvent('error', {
    error_message: error,
    context,
    session_id: generateSessionId(),
  });
};

// 세션 ID 생성 (Slack 로깅과 동일한 형식)
const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SESSION_${timestamp}_${random}`.toUpperCase();
}; 