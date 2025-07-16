'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { getStepTip } from '@/shared/utils/tipUtils';
import { StepType } from '@/shared/data/stepTips';
import { logUserEventNew } from '@/shared/utils/sendToSlack';
import { v4 as uuidv4 } from 'uuid';

type StepRecord = {
  name: string;
  endTime?: number;
  duration?: number;
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeWithHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

function TimerClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalTime = parseFloat(searchParams.get('totalTime') || '0') * 3600; // 시간 → 초
  // 단계 한글명과 영어 key 매핑
  const steps = useMemo(() => ['스케치', '채색', '묘사', '정리'], []);
  const stepKeys = ['sketch', 'color', 'detail', 'organize'];
  // 단계별 시간 파싱 (쿼리 파라미터에서)
  const stepTimesInSeconds = stepKeys.map((key) => {
    const val = searchParams.get(key);
    return val ? parseFloat(val) * 3600 : null;
  });
  // 자동 분배: 값이 null인 경우 균등 분배
  const autoCount = stepTimesInSeconds.filter((v) => v === null).length;
  const autoTime = autoCount > 0
    ? (totalTime - stepTimesInSeconds.filter((v) => v !== null).reduce((a, b) => a + (b || 0), 0)) / autoCount
    : 0;
  const finalStepTimes = stepTimesInSeconds.map((v) => v === null ? autoTime : v);
  const isPaused = searchParams.get('isPaused') === 'true';

  // 일시정지된 세션인지 확인
  const pausedStepRecords = searchParams.get('stepRecords');
  const pausedStartedAt = searchParams.get('startedAt');
  
  let initialStepRecords: StepRecord[];
  let initialCurrentStep: number;
  let initialStartTime: number;
  
  if (isPaused && pausedStepRecords && pausedStartedAt) {
    try {
      initialStepRecords = JSON.parse(decodeURIComponent(pausedStepRecords));
      initialStartTime = parseInt(pausedStartedAt);
      // 완료되지 않은 첫 번째 단계 찾기
      initialCurrentStep = initialStepRecords.findIndex(step => step.endTime === undefined);
      if (initialCurrentStep === -1) {
        initialCurrentStep = 0;
      }
    } catch {
      initialStepRecords = steps.map((name) => ({ name }));
      initialCurrentStep = 0;
      initialStartTime = Date.now();
    }
  } else {
    initialStepRecords = steps.map((name) => ({ name }));
    initialCurrentStep = 0;
    initialStartTime = Date.now();
  }

  // 일시정지된 세션의 경우 이미 진행된 시간 계산
  const initialElapsedTime = isPaused ? 
    initialStepRecords
      .filter(step => step.endTime !== undefined)
      .reduce((acc, step) => acc + (step.duration || 0), 0) : 0;
  
  const initialRemainingTime = totalTime - initialElapsedTime;

  const [remainingTime, setRemainingTime] = useState(initialRemainingTime);
  const [startTime] = useState(initialStartTime);
  const [currentStep, setCurrentStep] = useState(initialCurrentStep);
  const [stepRecords, setStepRecords] = useState<StepRecord[]>(initialStepRecords);
  const [isFinished, setIsFinished] = useState(false);

  // 실제 타이머 로직과 연동

  // 단계별로 1회만 랜덤 팁을 고정 (초과 전용 팁은 초과 시에만 노출)
  const tipRef = useRef<string>('');
  const prevStepRef = useRef<number | null>(null);
  const prevOvertimeRef = useRef<boolean>(false);

  // 현재 단계와 초과 상태 계산
  const stepTypeMap: Record<string, StepType> = {
    '스케치': 'sketch',
    '채색': 'color',
    '묘사': 'detail',
    '정리': 'finish',
  };
  const currentStepType: StepType = stepTypeMap[steps[currentStep]];
  const isOvertime = remainingTime <= 0;

  if (
    prevStepRef.current !== currentStep ||
    (isOvertime && !prevOvertimeRef.current)
  ) {
    // 단계가 바뀌었거나, 초과로 처음 진입한 경우 팁 갱신
    tipRef.current = getStepTip(currentStepType, isOvertime);
    prevStepRef.current = currentStep;
    prevOvertimeRef.current = isOvertime;
  }

  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      if (isPaused) {
        // 일시정지된 세션의 경우 이미 진행된 시간을 고려
        const newRemaining = remainingTime - 1;
        setRemainingTime(newRemaining);
        // 시간 초과해도 타이머는 계속 진행 (강제 종료하지 않음)
      } else {
        // 새로운 세션의 경우 startTime 기준으로 계산
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newRemaining = totalTime - elapsed;
        setRemainingTime(newRemaining);
        // 시간 초과해도 타이머는 계속 진행 (강제 종료하지 않음)
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [totalTime, startTime, isFinished, isPaused, remainingTime]);

  // 세션 ID: 세션 시작 시 1회 생성, 리렌더에도 유지
  const sessionIdRef = useRef<string | null>(null);
  if (sessionIdRef.current === null && typeof window !== 'undefined') {
    sessionIdRef.current = uuidv4();
  }

  // 타이머 시작 시 /api/log-session-start 호출
  useEffect(() => {
    if (!sessionIdRef.current) return;
    const userId = 'test-user';
    const sessionId = sessionIdRef.current;
    const subject = searchParams.get('subject') || '풍경 그리기';
    const goalTime = searchParams.get('totalTime') || '1';
    const startedAt = new Date().toISOString();
    // 최초 1회만 호출
    let called = false;
    if (!called) {
      called = true;
      fetch('/api/log-session-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          subject,
          goalTime,
          startedAt,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('log-session-start 실패');
      }).catch(e => {
        console.warn('[log-session-start] 호출 실패:', e);
      });
    }
  }, []);

  // beforeunload 이탈 추적
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const userId = 'test-user'; // 고정
        const sessionId = sessionIdRef.current;
        if (!userId || !sessionId) return;
        const currentStepName = steps[currentStep];
        const elapsedSec = totalTime - remainingTime;
        const elapsedStr = formatTime(elapsedSec);
        const payload = {
          userId,
          sessionId,
          currentStep: currentStepName,
          elapsed: elapsedStr,
        };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/unexpected-exit', blob);
      } catch (e) {
        console.warn('[unexpected-exit] 호출 실패:', e);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentStep, remainingTime, totalTime, steps]);

  const handleStepComplete = () => {
    const now = Math.floor((Date.now() - startTime) / 1000);
    const prevDuration = stepRecords
      .slice(0, currentStep)
      .reduce((acc, step) => acc + (step.duration || 0), 0);
    const duration = now - prevDuration;

    const updatedRecords = [...stepRecords];
    updatedRecords[currentStep] = {
      ...updatedRecords[currentStep],
      endTime: now,
      duration,
    };
    setStepRecords(updatedRecords);

    // Slack 로그 전송
    const subject = searchParams.get('subject') || '풍경 그리기';
    logUserEventNew.stepComplete(steps[currentStep], duration, subject);

    // [추가] 단계 완료 시 /api/log-step-complete 호출
    const userId = 'test-user';
    const sessionId = sessionIdRef.current;
    const step = steps[currentStep];
    const completedAt = new Date().toISOString();
    const elapsed = formatTime(now); // '00:45:12' 등
    fetch('/api/log-step-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessionId,
        step,
        completedAt,
        elapsed,
      }),
    }).then(res => {
      if (!res.ok) throw new Error('log-step-complete 실패');
    }).catch(e => {
      console.warn('[log-step-complete] 호출 실패:', e);
    });

    if (currentStep === steps.length - 1) {
      setIsFinished(true);
      // 세션 완료 로그 전송
      const totalDuration = updatedRecords
        .filter(step => step.duration)
        .reduce((acc, step) => acc + (step.duration || 0), 0);
      const isOvertime = totalDuration > totalTime;
      const stepRecordsForLog = updatedRecords
        .filter(step => step.duration)
        .map(step => ({ name: step.name, duration: step.duration || 0 }));
      logUserEventNew.sessionComplete(subject, totalDuration, isOvertime, stepRecordsForLog);
      // [추가] 세션 종료 시 /api/log-session-end 호출
      const userId = 'test-user';
      const sessionId = sessionIdRef.current;
      const endedAt = new Date().toISOString();
      const totalElapsed = formatTime(totalDuration); // '03:12:04' 등
      fetch('/api/log-session-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          endedAt,
          totalElapsed,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('log-session-end 실패');
      }).catch(e => {
        console.warn('[log-session-end] 호출 실패:', e);
      });
      // 업데이트된 stepRecords를 직접 전달
      navigateToSessionDetailWithRecords(true, updatedRecords);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePause = () => {
    // Slack 로그 전송
    const subject = searchParams.get('subject') || '풍경 그리기';
    const elapsed = totalTime - remainingTime;
    logUserEventNew.sessionPause(subject, steps[currentStep], elapsed);
    
    // 현재 진행 상황을 유지하면서 일시정지
    navigateToSessionDetail(false);
  };

  const navigateToSessionDetail = (finished: boolean) => {
    const params = new URLSearchParams({
      subject: searchParams.get('subject') || '풍경 그리기',
      type: searchParams.get('type') || '사고의 전환',
      startedAt: startTime.toString(),
      totalTime: totalTime.toString(),
      isFinished: finished.toString(),
      stepRecords: encodeURIComponent(JSON.stringify(stepRecords)),
      remainingTime: remainingTime.toString() // 정확한 남은 시간 전달
    });
    
    router.push(`/session-detail?${params.toString()}`);
  };

  const navigateToSessionDetailWithRecords = (finished: boolean, records: StepRecord[]) => {
    const params = new URLSearchParams({
      subject: searchParams.get('subject') || '풍경 그리기',
      type: searchParams.get('type') || '사고의 전환',
      startedAt: startTime.toString(),
      totalTime: totalTime.toString(),
      isFinished: finished.toString(),
      stepRecords: encodeURIComponent(JSON.stringify(records)),
      remainingTime: remainingTime.toString() // 정확한 남은 시간 전달
    });
    
    router.push(`/session-detail?${params.toString()}`);
  };

  const elapsed = totalTime - remainingTime;
  const overTime = elapsed > totalTime ? elapsed - totalTime : 0;
  const progress = Math.min((elapsed / totalTime) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="card p-6 mb-8">
          <div className="flex items-center relative">
            <button
              onClick={() => router.push('/session-setup')}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 z-10"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1 className="text-sm font-medium text-gray-700 mb-1 px-2 break-words text-center">
                {searchParams.get('subject') || '풍경 그리기'}
              </h1>
              <p className="text-sm text-gray-500 text-center">
                {searchParams.get('type') || '사고의 전환'}
              </p>
              {isPaused && (
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  이어서 그리기
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 메인 타이머 카드 */}
        <div className="card p-8 mb-6 text-center">
          {/* 진행률 바 */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  remainingTime <= 0 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className={`text-sm mt-2 ${
              remainingTime <= 0 ? 'text-red-500 font-medium' : 'text-gray-500'
            }`}>
              {remainingTime <= 0 ? '시간 초과' : `${Math.round(progress)}% 완료`}
            </div>
          </div>

          {/* 전체 타이머 */}
          <div className="mb-6">
            <div className={`text-5xl font-bold font-mono mb-2 ${
              remainingTime <= 0 ? 'text-red-500' : 'text-gray-900'
            }`}>
              {remainingTime <= 0 ? formatTime(overTime) : formatTime(Math.abs(remainingTime))}
            </div>
            {remainingTime <= 0 && (
              <div className="text-lg text-red-500 font-medium">
                초과 시간
              </div>
            )}
          </div>

          {/* 현재 단계 */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2">
              <div className="text-lg font-medium text-gray-700">
                현재 단계
              </div>
              <div className="text-lg font-bold text-blue-600">
                {steps[currentStep]}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              경과 시간: {formatTimeWithHours(elapsed)}
            </div>
          </div>

          {/* 단계별 팁 영역 */}
          <div className="flex items-start justify-center gap-1">
            <span className="text-sm font-medium text-gray-700">Tip.</span>
            <p className="text-sm text-gray-600 italic">{tipRef.current}</p>
          </div>
        </div>

        {/* 단계별 기록 카드 */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">단계별 진행 상황</h3>
          <div className="space-y-3">
            {stepRecords.map((step, idx) => {
              // 목표 시간(분) 표기
              const stepGoalMin = Math.round((finalStepTimes[idx] || 0) / 60);
              if (step.endTime !== undefined) {
                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{step.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({stepGoalMin}분 목표)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">
                        {formatTimeWithHours(step.endTime)} 완료
                      </div>
                      <div className="text-xs text-green-500">
                        {formatTimeWithHours(step.duration || 0)} 소요
                      </div>
                    </div>
                  </div>
                );
              } else if (idx === currentStep) {
                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div>
                      <span className="font-medium text-gray-900">{step.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({stepGoalMin}분 목표)</span>
                    </div>
                    <span className="text-sm text-blue-600 font-semibold">진행 중</span>
                  </div>
                );
              } else {
                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-500">{step.name}</span>
                      <span className="text-sm text-gray-400 ml-2">({stepGoalMin}분 목표)</span>
                    </div>
                    <span className="text-sm text-gray-400">대기 중</span>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="h-24" />
      </div>
      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md mx-auto px-4 pt-2 pb-6 bg-white z-50 border-t border-gray-200">
        <div className="flex gap-3">
          <button 
            onClick={handlePause}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
          >
            일시정지
          </button>
          <button 
            onClick={handleStepComplete}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
              remainingTime <= 0 
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl' 
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
            }`}
          >
            {remainingTime <= 0 ? '현재 단계 완료 (시간 초과)' : '현재 단계 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TimerClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">타이머를 불러오는 중...</p>
        </div>
      </div>
    }>
      <TimerClientContent />
    </Suspense>
  );
}