'use client';

import { useState } from 'react';
import { sendTestMessage, logUserEvent, logUserEventNew } from '@/shared/utils/sendToSlack';

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

  const handleTestEvents = async () => {
    setIsLoading(true);
    setMessage('테스트 이벤트 전송 중...');
    
    try {
      // 여러 테스트 이벤트 전송
      await logUserEvent.sessionStart('테스트 주제', '사고의 전환', 180);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEvent.stepComplete('스케치', 120, '테스트 주제');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEvent.sessionComplete('테스트 주제', 180, false);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEvent.imageSave('테스트 주제', 'test_image.png');
      
      setMessage('✅ 모든 테스트 이벤트가 성공적으로 전송되었습니다!');
    } catch (error) {
      setMessage(`❌ 테스트 이벤트 전송 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNewEvents = async () => {
    setIsLoading(true);
    setMessage('새로운 포맷 테스트 이벤트 전송 중...');
    
    try {
      // 새로운 포맷 테스트 이벤트 전송
      await logUserEventNew.sessionStart('테스트 주제', '사고의 전환', 3, {
        sketch: 0.5,
        color: 0.75,
        detail: 0.5,
        organize: 0.25
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEventNew.stepComplete('스케치', 120, '테스트 주제');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEventNew.sessionComplete('테스트 주제', 180, false, [
        { name: '스케치', duration: 120 },
        { name: '채색', duration: 180 },
        { name: '묘사', duration: 90 },
        { name: '정리', duration: 60 }
      ]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logUserEventNew.imageSave('테스트 주제', 'test_image.png');
      
      setMessage('✅ 모든 새로운 포맷 테스트 이벤트가 성공적으로 전송되었습니다!');
    } catch (error) {
      setMessage(`❌ 새로운 포맷 테스트 이벤트 전송 실패: ${error}`);
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
              onClick={handleTestEvents}
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '전송 중...' : '기본 사용자 이벤트 테스트'}
            </button>
            
            <button
              onClick={handleTestNewEvents}
              disabled={isLoading}
              className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '전송 중...' : '새로운 포맷 이벤트 테스트'}
            </button>
          </div>

          {/* 결과 메시지 */}
          {message && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          )}

          {/* 환경 변수 확인 */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">환경 변수 확인</h3>
            <p className="text-xs text-yellow-700">
              NEXT_PUBLIC_SLACK_WEBHOOK_URL: {process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL ? '✅ 설정됨' : '❌ 설정되지 않음'}
            </p>
          </div>
        </div>

        {/* 안내 텍스트 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            .env.local 파일에 NEXT_PUBLIC_SLACK_WEBHOOK_URL을 설정해주세요.
          </p>
        </div>
      </div>
    </div>
  );
} 