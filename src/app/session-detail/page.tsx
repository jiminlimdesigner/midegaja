'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { logUserEventNew } from '@/shared/utils/sendToSlack';

type StepRecord = {
  name: string;
  endTime?: number;
  duration?: number;
};

type SessionData = {
  subject: string;
  type: string;
  startedAt: number;
  stepRecords: StepRecord[];
  totalTime: number;
  isFinished: boolean;
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

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
}

function SessionDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [savedDescription, setSavedDescription] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    // URL 파라미터에서 데이터 추출
    const subject = searchParams.get('subject') || '풍경 그리기';
    const type = searchParams.get('type') || '사고의 전환';
    const startedAt = parseInt(searchParams.get('startedAt') || Date.now().toString());
    const totalTime = parseInt(searchParams.get('totalTime') || '0');
    const isFinished = searchParams.get('isFinished') === 'true';
    const remainingTime = searchParams.get('remainingTime'); // 전달받은 정확한 남은 시간
    
    // stepRecords 파싱
    const stepRecordsParam = searchParams.get('stepRecords');
    let stepRecords: StepRecord[] = [];
    
    if (stepRecordsParam) {
      try {
        stepRecords = JSON.parse(decodeURIComponent(stepRecordsParam));
      } catch {
        // 기본값으로 설정
        stepRecords = ['스케치', '채색', '묘사', '정리'].map(name => ({ name }));
      }
    } else {
      stepRecords = ['스케치', '채색', '묘사', '정리'].map(name => ({ name }));
    }

    setSessionData({
      subject,
      type,
      startedAt,
      stepRecords,
      totalTime,
      isFinished
    });

    // 전달받은 정확한 남은 시간이 있으면 사용
    if (remainingTime && !isFinished) {
      setElapsedTime(totalTime - parseInt(remainingTime));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!sessionData) return;

    if (sessionData.isFinished) {
      // 완료된 세션은 실제 소요 시간 계산
      const actualElapsedTime = sessionData.stepRecords
        .filter(step => step.endTime !== undefined)
        .reduce((acc, step) => acc + (step.duration || 0), 0);
      
      setElapsedTime(actualElapsedTime);
      return;
    }

    // 전달받은 정확한 남은 시간이 없을 때만 계산된 시간 사용
    const remainingTime = searchParams.get('remainingTime');
    if (!remainingTime) {
      // 일시정지된 세션의 경우 현재까지 진행된 시간 계산하고 타이머 멈춤
      const completedStepsTime = sessionData.stepRecords
        .filter(step => step.endTime !== undefined)
        .reduce((acc, step) => acc + (step.duration || 0), 0);
      
      setElapsedTime(completedStepsTime);
    }
    
    // 일시정지된 세션에서는 타이머를 동작시키지 않음
    return;
  }, [sessionData, searchParams]);

  const handleBack = () => {
    router.back();
  };

  const handleSaveDescription = () => {
    setSavedDescription(editingDescription);
    setIsEditingDescription(false);
  };

  const handleCancelDescription = () => {
    setIsEditingDescription(false);
    setEditingDescription('');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleContinue = () => {
    if (!sessionData) return;
    
    // 타이머 페이지로 이동하면서 기존 데이터 전달 (이어서 그리기)
    const params = new URLSearchParams({
      totalTime: (sessionData.totalTime / 3600).toString(), // 초 → 시간 변환
      subject: sessionData.subject,
      type: sessionData.type,
      stepRecords: encodeURIComponent(JSON.stringify(sessionData.stepRecords)),
      startedAt: sessionData.startedAt.toString(),
      isPaused: 'true'
    });
    
    router.push(`/timer?${params.toString()}`);
  };

  const handleSavePageAsImage = async () => {
    if (!pageRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
      // 하단 고정 버튼을 임시로 숨김
      const fixedButton = document.querySelector('.fixed.bottom-0');
      if (fixedButton) {
        (fixedButton as HTMLElement).style.display = 'none';
      }
      
      // 페이지 캡처
      const canvas = await html2canvas(pageRef.current, {
        backgroundColor: '#f9fafb', // bg-gray-50
        scale: 2, // 고해상도
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: pageRef.current.scrollWidth,
        height: pageRef.current.scrollHeight,
      });
      
      // 캔버스를 이미지로 변환
      const image = canvas.toDataURL('image/png', 1.0);
      
      // 다운로드 링크 생성
      const fileName = `${formatDate(sessionData?.startedAt || Date.now())}_${sessionData?.subject}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Slack 로그 전송
      if (sessionData) {
        logUserEventNew.imageSave(sessionData.subject, fileName);
      }
      
    } catch (error) {
      console.error('페이지 캡처 중 오류:', error);
      alert('페이지 저장 중 오류가 발생했습니다.');
      
      // 에러 로그 전송
      logUserEventNew.error(error instanceof Error ? error.message : String(error), '이미지 저장');
    } finally {
      // 하단 고정 버튼 다시 표시
      const fixedButton = document.querySelector('.fixed.bottom-0');
      if (fixedButton) {
        (fixedButton as HTMLElement).style.display = 'block';
      }
      setIsCapturing(false);
    }
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">세션 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" ref={pageRef}>
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="p-3 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* 이미지 업로드 영역 */}
        <div className="card p-6 mb-6">
          <div 
            className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={handleImageClick}
          >
            {uploadedImage ? (
              <Image 
                src={uploadedImage} 
                alt="업로드된 그림" 
                className="w-full h-full object-cover rounded-xl"
                width={400}
                height={300}
              />
            ) : (
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 font-medium">완성한 그림 등록하기</p>
                <p className="text-gray-400 text-sm mt-1">클릭하여 이미지 업로드</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* 세션 정보 카드 */}
        <div className="card p-6 mb-6">
          <div className="space-y-5">
            <div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">유형</span>
              <p className="text-xl font-semibold text-gray-900 mt-1">{sessionData.type}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">주제</span>
              <p className="text-xl font-semibold text-gray-900 mt-1">{sessionData.subject}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                총 시험 시간
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatTimeWithHours(sessionData.totalTime)}
              </p>
            </div>

            {/* 실제 소요 시간 표시 (완료된 경우) */}
            {sessionData.isFinished && (
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  실제 소요 시간
                </span>
                <p className={`text-xl font-semibold mt-1 ${
                  elapsedTime > sessionData.totalTime ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatTimeWithHours(elapsedTime)}
                  {elapsedTime > sessionData.totalTime && (
                    <span className="text-sm text-red-500 ml-2">
                      (+{formatTimeWithHours(elapsedTime - sessionData.totalTime)})
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* 일시정지된 세션인 경우 남은 시간 표시 */}
            {!sessionData.isFinished && (
              <div className="pt-3 border-t border-gray-200">
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    남은 시간
                  </span>
                  <p className="text-lg font-semibold text-orange-600 mt-1">
                    {formatTimeWithHours(sessionData.totalTime - elapsedTime)}
                  </p>
                </div>
              </div>
            )}

            {/* 날짜 표시 */}
            <div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">시작 날짜</span>
              <p className="text-lg text-gray-900 mt-1">
                {formatDate(sessionData.startedAt)}
              </p>
            </div>

            {/* 설명 표시 */}
            {savedDescription && !isEditingDescription && (
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">작성한 설명</span>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{savedDescription}</p>
              </div>
            )}
          </div>
        </div>

        {/* 설명 작성/수정 영역 */}
        {isEditingDescription && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {savedDescription ? '설명 수정하기' : '설명 작성하기'}
            </h3>
            <textarea
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              placeholder="그림에 대한 설명을 작성해주세요..."
              className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveDescription}
                className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                완료
              </button>
              <button
                onClick={handleCancelDescription}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 단계별 기록 카드 */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">단계별 진행 기록</h3>
          <div className="space-y-3">
            {sessionData.stepRecords.map((step, idx) => {
              if (step.endTime !== undefined) {
                return (
                  <div key={idx} className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-900">{step.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {formatTime(step.endTime)} 완료
                      </div>
                      <div className="text-xs text-green-500">
                        {formatTime(step.duration || 0)} 소요
                      </div>
                    </div>
                  </div>
                );
              } else if (!sessionData.isFinished && idx === sessionData.stepRecords.findIndex(s => s.endTime === undefined)) {
                return (
                  <div key={idx} className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="font-medium text-gray-900">{step.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">진행 중</span>
                  </div>
                );
              } else {
                return (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-500">{step.name}</span>
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
        {sessionData.isFinished ? (
          <button
            onClick={handleSavePageAsImage}
            disabled={isCapturing}
            className="w-full bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? '저장 중...' : '이미지 저장하기'}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSavePageAsImage}
              disabled={isCapturing}
              className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCapturing ? '저장 중...' : '이미지 저장하기'}
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              이어서 그릴게요
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionDetail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">세션 정보를 불러오는 중...</p>
        </div>
      </div>
    }>
      <SessionDetailContent />
    </Suspense>
  );
}
