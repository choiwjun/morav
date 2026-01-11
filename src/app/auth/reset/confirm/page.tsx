'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 비밀번호 복잡성 검증
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: '비밀번호에 대문자를 포함해주세요.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: '비밀번호에 소문자를 포함해주세요.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '비밀번호에 숫자를 포함해주세요.' };
  }
  return { valid: true };
}

function ResetPasswordConfirmContent() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // URL에서 토큰 확인 (Supabase는 hash fragment로 토큰 전달)
  useEffect(() => {
    // hash fragment 또는 query param에서 토큰 확인
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    const hasToken =
      hash.includes('access_token') ||
      searchParams.has('access_token') ||
      hash.includes('type=recovery');

    setHasValidToken(hasToken);
    setIsInitialized(true);

    if (!hasToken) {
      router.push('/auth/reset');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 비밀번호 복잡성 검증
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || '비밀번호 형식이 올바르지 않습니다.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw new Error(error.message || '비밀번호 재설정에 실패했습니다.');
      }

      setSuccess(true);

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기화 전에는 로딩 표시
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 토큰이 없으면 빈 화면 (리다이렉트 중)
  if (!hasValidToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">모라브</h1>
          <p className="text-gray-600 mt-2">비밀번호 재설정</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {success ? (
            // 성공 메시지
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">비밀번호가 변경되었습니다!</h2>
              <p className="text-gray-600 mb-6">
                로그인 페이지로 이동합니다...
              </p>
              <Button
                type="button"
                variant="default"
                size="lg"
                className="w-full"
                onClick={() => router.push('/auth/login')}
              >
                로그인 페이지로 이동
              </Button>
            </div>
          ) : (
            // 비밀번호 재설정 폼
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-gray-600 mb-6">
                새로운 비밀번호를 입력해주세요.
              </p>

              {/* 새 비밀번호 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  새 비밀번호
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="8자 이상 입력"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  대문자, 소문자, 숫자 포함 8자 이상
                </p>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="비밀번호 다시 입력"
                  required
                  minLength={8}
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* 변경 버튼 */}
              <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
                {loading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </form>
          )}

          {/* 로그인 링크 */}
          {!success && (
            <div className="mt-6 text-center">
              <a
                href="/auth/login"
                className="text-sm text-blue-500 hover:underline"
              >
                로그인 페이지로 돌아가기
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}
