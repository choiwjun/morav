'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';

// 온보딩 단계 정의
const ONBOARDING_STEPS: string[] = [
  '블로그 연결',
  'API 키 등록',
  '카테고리 선택',
  '스케줄 설정',
];

// 온보딩 경로와 단계 번호 매핑
const STEP_MAPPING: Record<string, number> = {
  '/onboarding/connect-blog': 1,
  '/onboarding/api-key': 2,
  '/onboarding/category': 3,
  '/onboarding/schedule': 4,
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // 현재 단계 계산
  const currentStep = STEP_MAPPING[pathname] || 1;

  // 인증 체크 - 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [router]);

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (currentStep > 1) {
      // 첫 단계가 아니면 이전 단계로 이동
      const stepKeys = Object.keys(STEP_MAPPING) as string[];
      const currentIndex = stepKeys.indexOf(pathname);
      if (currentIndex > 0) {
        router.push(stepKeys[currentIndex - 1]);
      }
    }
  };

  // 나가기 핸들러 - 대시보드로 이동
  const handleExit = () => {
    if (confirm('온보딩을 중단하고 대시보드로 이동하시겠습니까?')) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* 로고 및 나가기 버튼 */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">모라브</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExit}
                className="text-gray-600 hover:text-gray-900"
              >
                나가기
              </Button>
            </div>

            {/* 단계 번호 표시 */}
            <div className="text-sm text-gray-600">
              단계 {currentStep} / {ONBOARDING_STEPS.length}
            </div>
          </div>
        </div>
      </header>

      {/* 온보딩 프로그레스 바 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={ONBOARDING_STEPS.length}
            steps={ONBOARDING_STEPS}
          />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 (첫 단계 제외) */}
        {currentStep > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-6 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로가기
          </Button>
        )}

        {/* 페이지 컨텐츠 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="mt-auto py-8 bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>© 2026 모라브. 모든 권리 보유.</p>
        </div>
      </footer>
    </div>
  );
}
