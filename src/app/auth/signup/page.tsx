'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleOAuthButton } from '@/components/common/GoogleOAuthButton';

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

  // 비밀번호 복잡성 검증
  const validatePassword = (password: string): { valid: boolean; error?: string } => {
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
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, error: '비밀번호에 특수문자를 포함해주세요.' };
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 약관 동의 검증
    if (!agreements.terms || !agreements.privacy) {
      setError('필수 약관에 동의해주세요.');
      return;
    }

    // 비밀번호 복잡성 검증
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || '비밀번호 형식이 올바르지 않습니다.');
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
                대문자, 소문자, 숫자 포함 8자 이상
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
          <GoogleOAuthButton
            text="구글로 시작하기"
            onSuccess={() => console.log('Google signup success')}
            onError={(err) => setError(err.message)}
          />
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
