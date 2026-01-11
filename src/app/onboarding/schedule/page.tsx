'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState({
    publishTime: '09:00',
    publishDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 발행 요일 정의
  const daysOfWeek = [
    { id: 'Monday', label: '월요일' },
    { id: 'Tuesday', label: '화요일' },
    { id: 'Wednesday', label: '수요일' },
    { id: 'Thursday', label: '목요일' },
    { id: 'Friday', label: '금요일' },
    { id: 'Saturday', label: '토요일' },
    { id: 'Sunday', label: '일요일' },
  ];

  // 발행 시간 정의
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00',
  ];

  // 발행 요일 토글
  const handleToggleDay = (dayId: string) => {
    setError('');

    if (schedule.publishDays.includes(dayId)) {
      // 선택 해제 (최소 1개 유지)
      if (schedule.publishDays.length > 1) {
        setSchedule({
          ...schedule,
          publishDays: schedule.publishDays.filter((day) => day !== dayId),
        });
      } else {
        setError('최소 1개 이상의 요일을 선택해주세요.');
      }
    } else {
      // 선택
      setSchedule({
        ...schedule,
        publishDays: [...schedule.publishDays, dayId],
      });
    }
  };

  // 발행 시간 변경
  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setError('');
    setSchedule({
      ...schedule,
      publishTime: e.target.value,
    });
  };

  // 빠른 설정 선택 (프리셋)
  const handlePreset = (preset: 'workday' | 'allday' | 'weekend') => {
    setError('');
    switch (preset) {
      case 'workday':
        setSchedule({
          publishTime: '09:00',
          publishDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        });
        break;
      case 'allday':
        setSchedule({
          publishTime: '09:00',
          publishDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        });
        break;
      case 'weekend':
        setSchedule({
          publishTime: '09:00',
          publishDays: ['Saturday', 'Sunday'],
        });
        break;
    }
  };

  // 스케줄 저장 및 온보딩 완료
  const handleCompleteOnboarding = async () => {
    if (schedule.publishDays.length === 0) {
      setError('최소 1개 이상의 요일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: API 연동 (3.5.1, 3.5.2, 3.5.3 태스크 완료 후)
      const response = await fetch('/api/user/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publishTime: schedule.publishTime,
          publishDays: schedule.publishDays,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '스케줄 저장에 실패했습니다.');
      }

      setSuccess('온보딩이 완료되었습니다. 대시보드로 이동합니다...');
      
      // 온보딩 완료 플래그 설정 (3.5.5 태스크)
      await fetch('/api/user/onboarding/complete', {
        method: 'POST',
      });

      // 1.5초 후 대시보드로 이동 (3.5.5 태스크)
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '스케줄 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            스케줄 설정
          </h2>
          <p className="text-gray-600">
            AI가 생성한 콘텐츠를 자동으로 발행할 시간과 요일을 설정해주세요.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* 빠른 설정 프리셋 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            빠른 설정
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handlePreset('workday')}
              disabled={loading}
              className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">💼</div>
              <div className="font-semibold text-gray-900">평일 9시</div>
              <div className="text-sm text-gray-600">월~금, 09:00</div>
            </button>
            <button
              onClick={() => handlePreset('allday')}
              disabled={loading}
              className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">📅</div>
              <div className="font-semibold text-gray-900">매일 9시</div>
              <div className="text-sm text-gray-600">월~일, 09:00</div>
            </button>
            <button
              onClick={() => handlePreset('weekend')}
              disabled={loading}
              className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">🎉</div>
              <div className="font-semibold text-gray-900">주말 9시</div>
              <div className="text-sm text-gray-600">토~일, 09:00</div>
            </button>
          </div>
        </div>

        {/* 스케줄 설정 폼 */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            상세 설정
          </h3>

          {/* 발행 시간 */}
          <div className="mb-8">
            <label htmlFor="publishTime" className="block text-sm font-medium mb-2">
              발행 시간
            </label>
            <select
              id="publishTime"
              value={schedule.publishTime}
              onChange={handleTimeChange}
              disabled={loading}
              className="w-full max-w-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              선택한 시간에 AI가 생성한 콘텐츠가 발행됩니다.
            </p>
          </div>

          {/* 발행 요일 */}
          <div>
            <label className="block text-sm font-medium mb-4">
              발행 요일
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {daysOfWeek.map((day) => {
                const isSelected = schedule.publishDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    onClick={() => handleToggleDay(day.id)}
                    disabled={loading}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                      }
                      ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-sm'}
                    `}
                  >
                    <div className="font-semibold">{day.label}</div>
                    {isSelected && (
                      <div className="mt-1 flex justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              최소 1개 이상의 요일을 선택해주세요. 콘텐츠는 선택한 요일에만 발행됩니다.
            </p>
          </div>
        </div>

        {/* 선택된 스케줄 요약 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">
            설정된 스케줄
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m0 0l-3-3M4 4h16a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V7a1 1 0 00-1-1H4z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">발행 시간</div>
                <div className="text-sm text-gray-600">{schedule.publishTime}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 0V3m-4 0V3m0 0V3m0 0V3m0 0V3m-4 0v8h16V3m-4 0v8h16V3m-4 0v8h16" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">발행 요일</div>
                <div className="text-sm text-gray-600">
                  {schedule.publishDays.map((dayId) => {
                    const day = daysOfWeek.find((d) => d.id === dayId);
                    return day?.label;
                  }).join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 온보딩 완료 버튼 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              모든 설정 완료!
            </h3>
            <p className="text-gray-600 mb-6">
              이제 AI가 콘텐츠를 자동으로 생성하고 발행할 준비가 되었습니다.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>블로그 연결: 완료</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>API 키 등록: 완료</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>카테고리 선택: 완료</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>스케줄 설정: 완료</span>
              </div>
            </div>
            <Button
              onClick={handleCompleteOnboarding}
              disabled={loading}
              size="lg"
              className="min-w-[280px]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  온보딩 완료 및 대시보드 이동
                </span>
              ) : (
                '온보딩 완료 및 대시보드 시작'
              )}
            </Button>
          </div>
        </div>

        {/* 이전 버튼 */}
        <div className="flex justify-start pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/onboarding/category'}
            disabled={loading}
            size="lg"
            className="min-w-[200px]"
          >
            이전: 카테고리 선택
          </Button>
        </div>
      </div>
    </div>
  );
}
