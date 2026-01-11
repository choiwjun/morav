'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 약관 동의 검증
    if (!agreements.terms || !agreements.privacy) {
      setError('필수 약관에 동의해주세요.');
      return;
    }

    // 비밀번호 길이 검증
    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // TODO: API 연동 (2.1.2 태스크 완료 후)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          marketing_consent: agreements.marketing,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      // 회원가입 성공 시 온보딩으로 이동
      router.push('/onboarding/connect-blog');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding/connect-blog`,
        },
      });

      if (error) {
        setError('Google 로그인에 실패했습니다.');
      }
    } catch {
      setError('Google 로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">모라브</h1>
          <p className="text-gray-600 mt-2">블로그 자동화의 시작</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-center mb-2">무료로 시작하세요</h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            5건 무료 발행 제공
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                이름
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
                required
              />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                비밀번호
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
                영문, 숫자, 특수문자 조합 8자 이상
              </p>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 border-t pt-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={agreements.terms}
                  onChange={(e) => setAgreements({ ...agreements, terms: e.target.checked })}
                  required
                  className="mt-1"
                />
                <span className="text-sm ml-2">
                  <a href="/terms" className="text-blue-500 hover:underline">
                    이용약관
                  </a>{' '}
                  동의 (필수)
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={agreements.privacy}
                  onChange={(e) => setAgreements({ ...agreements, privacy: e.target.checked })}
                  required
                  className="mt-1"
                />
                <span className="text-sm ml-2">
                  <a href="/privacy" className="text-blue-500 hover:underline">
                    개인정보처리방침
                  </a>{' '}
                  동의 (필수)
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={agreements.marketing}
                  onChange={(e) => setAgreements({ ...agreements, marketing: e.target.checked })}
                  className="mt-1"
                />
                <span className="text-sm text-gray-600 ml-2">
                  마케팅 수신 동의 (선택)
                </span>
              </label>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 회원가입 버튼 */}
            <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
              {loading ? '가입 중...' : '무료로 시작하기'}
            </Button>
          </form>

          {/* 소셜 로그인 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* Google 소셜 로그인 */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleSignup}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            구글로 시작하기
          </Button>
        </div>

        {/* 로그인 링크 */}
        <p className="text-center text-sm text-gray-600 mt-6">
          이미 계정이 있으신가요?{' '}
          <a href="/auth/login" className="text-blue-500 font-semibold hover:underline">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}
