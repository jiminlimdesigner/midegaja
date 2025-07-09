'use client';

import { useState } from 'react';
import { sendTestMessage, logUserEventNew } from '@/shared/utils/sendToSlack';

export default function TestSlackPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTestMessage = async () => {
    setIsLoading(true);
    setMessage('테스트 메시지 전송 중...');
    
    try {
      await sendTestMessage();
      setMessage('✅ 테스트 메시지가 성공적으로 전송되었습니다!');
    } catch (error) {
      setMessage(`❌ 테스트 메시지 전송 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSessionEvents = async () => {
    setIsLoading(true);
    setMessage('세션 이벤트 테스트 전송 중... (#logger-session 채널)');
    
    try {
      // 세션 관련 이벤트 전송 (logger-session 채널)
      await logUserEventNew.sessionStart('테스트 주제', '사고의 전환', 3, {
        sketch: 0.5,
        color: 0.75,
        detail: 0.5,
        organize: 0.25
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEventNew.sessionPause('테스트 주제', '채색', 180);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEventNew.imageSave('테스트 주제', 'test_image.png');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEventNew.sessionComplete('테스트 주제', 180, false, [
        { name: '스케치', duration: 120 },
        { name: '채색', duration: 180 },
        { name: '묘사', duration: 90 },
        { name: '정리', duration: 60 }
      ]);
      
      setMessage('✅ 세션 이벤트가 #logger-session 채널에 성공적으로 전송되었습니다!');
    } catch (error) {
      setMessage(`❌ 세션 이벤트 전송 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestErrorEvents = async () => {
    setIsLoading(true);
    setMessage('에러 이벤트 테스트 전송 중... (#logger-error 채널)');
    
    try {
      // 에러 이벤트 전송 (logger-error 채널)
      await logUserEventNew.error('TypeError: Cannot read property of undefined', 'Timer 페이지');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEventNew.error('NetworkError: Failed to fetch', 'API 호출 중');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEventNew.error('ValidationError: Invalid input data', '폼 제출');
      
      setMessage('✅ 에러 이벤트가 #logger-error 채널에 성공적으로 전송되었습니다!');
    } catch (error) {
      setMessage(`❌ 에러 이벤트 전송 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Slack 연동 테스트</h1>
          <p className="text-gray-600">Slack Webhook 연동을 테스트해보세요</p>
        </div>

        {/* 테스트 카드 */}
        <div className="card p-6 space-y-6">
          <div className="space-y-4">
            <button
              onClick={handleTestMessage}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '전송 중...' : '기본 테스트 메시지 전송'}
            </button>
            
            <button
              onClick={handleTestSessionEvents}
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '전송 중...' : '세션 이벤트 테스트 (#logger-session)'}
            </button>
            
            <button
              onClick={handleTestErrorEvents}
              disabled={isLoading}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '전송 중...' : '에러 이벤트 테스트 (#logger-error)'}
            </button>
          </div>

          {/* 결과 메시지 */}
          {message && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          )}

          {/* 환경 변수 안내 */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-800 mb-2">환경 변수 설정 완료</h3>
            <p className="text-xs text-green-700">
              ✅ SLACK_WEBHOOK_URL_LOGGER: 서버에서 사용 중
            </p>
            <p className="text-xs text-green-700">
              ✅ SLACK_WEBHOOK_URL_ERROR: 서버에서 사용 중
            </p>
            <p className="text-xs text-green-600 mt-2">
              (클라이언트에서는 보안상 접근할 수 없습니다)
            </p>
          </div>
        </div>

        {/* 안내 텍스트 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            환경 변수가 서버에서 정상적으로 설정되어 있습니다.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">테스트 가이드</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>기본 테스트 메시지</strong>: 기본 메시지 전송 테스트</li>
              <li>• <strong>세션 이벤트 테스트</strong>: #logger-session 채널로 세션 관련 로그 전송</li>
              <li>• <strong>에러 이벤트 테스트</strong>: #logger-error 채널로 에러 로그 전송</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 