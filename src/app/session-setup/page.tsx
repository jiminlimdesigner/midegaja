'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionSetupPage() {
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [type, setType] = useState('');
  const [totalTime, setTotalTime] = useState('');
  const [stageTimes, setStageTimes] = useState({
    sketch: '',
    color: '',
    detail: '',
    organize: '',
  });

  const handleStart = () => {
    if (!subject || !type || !totalTime) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }
    
    const query = new URLSearchParams({
      subject,
      type,
      totalTime,
      ...stageTimes,
    }).toString();
    router.push(`/timer?${query}`);
  };

  const isFormValid = subject && type && totalTime;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오늘도 화이팅!</h1>
          <p className="text-gray-600">새로운 그림 세션을 시작해보세요</p>
        </div>

        {/* 폼 카드 */}
        <div className="card p-6 space-y-6">
          {/* 주제 입력 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              주제
            </label>
            <input
              type="text"
              placeholder="그리고 싶은 주제를 입력해주세요"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
            />
          </div>

          {/* 유형 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              유형
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input"
            >
              <option value="">유형을 선택하세요</option>
              <option value="사고의 전환">사고의 전환</option>
              <option value="발상과 표현">발상과 표현</option>
            </select>
          </div>

          {/* 총 시간 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              총 시간
            </label>
            <select
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              className="input"
            >
              <option value="">시간을 선택하세요</option>
              <option value="0.0167">1분 (테스트용)</option>
              <option value="0.0333">2분 (테스트용)</option>
              <option value="0.0833">5분 (테스트용)</option>
              <option value="0.5">30분</option>
              <option value="1">1시간</option>
              <option value="1.5">1시간 30분</option>
              <option value="2">2시간</option>
              <option value="2.5">2시간 30분</option>
              <option value="3">3시간</option>
              <option value="3.5">3시간 30분</option>
              <option value="4">4시간</option>
            </select>
          </div>

          {/* 단계별 시간 설정 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">단계별 시간 설정 (선택사항)</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'sketch', label: '스케치' },
                { key: 'color', label: '채색' },
                { key: 'detail', label: '묘사' },
                { key: 'organize', label: '정리' }
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-xs text-gray-600">{label}</label>
                  <select
                    value={stageTimes[key as keyof typeof stageTimes]}
                    onChange={(e) =>
                      setStageTimes((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="input py-2 text-sm"
                  >
                    <option value="">자동</option>
                    <option value="0.0167">1분 (테스트용)</option>
                    <option value="0.0333">2분 (테스트용)</option>
                    <option value="0.0833">5분 (테스트용)</option>
                    <option value="0.25">15분</option>
                    <option value="0.5">30분</option>
                    <option value="0.75">45분</option>
                    <option value="1">1시간</option>
                    <option value="1.5">1시간 30분</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <div className="mt-6">
          <button
            onClick={handleStart}
            disabled={!isFormValid}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isFormValid
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            시작할게요
          </button>
        </div>

        {/* 안내 텍스트 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            단계별 시간을 설정하지 않으면 총 시간을 균등하게 분배합니다
          </p>
        </div>
      </div>
    </div>
  );
}