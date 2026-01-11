'use client';

import { useMemo } from 'react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function OnboardingProgress({ currentStep, totalSteps, steps }: OnboardingProgressProps) {
  const progressPercentage = useMemo(() => {
    return ((currentStep - 1) / (totalSteps - 1)) * 100;
  }, [currentStep, totalSteps]);

  return (
    <div className="w-full">
      {/* 진행 상태 바 */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 단계 표시 */}
      <div className="flex justify-between mt-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step} className="flex-1 flex flex-col items-center">
              {/* 단계 번호 원형 */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>

              {/* 단계 라인 (마지막 단계 제외) */}
              {stepNumber < totalSteps && (
                <div
                  className={`
                    absolute left-1/2 top-5 w-1/2 h-0.5 -translate-x-1/2 mt-5
                    ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                />
              )}

              {/* 단계 라벨 */}
              <span
                className={`
                  mt-2 text-xs text-center font-medium
                  ${isCompleted || isCurrent ? 'text-blue-600' : 'text-gray-400'}
                `}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
