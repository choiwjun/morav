'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    setLoading(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset/confirm`,
      });

      if (error) {
        throw new Error(error.message || '비밀번호 재설정 이메일 발송에 실패했습니다.');
      }

      setMessage('비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정 이메일 발송에 실패했습니다.');
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
          <p className="text-gray-600 mt-2">비밀번호 재설정</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-sm text-gray-600 mb-6">
            가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>

            {/* 성공 메시지 */}
            {message && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 전송 버튼 */}
            <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
              {loading ? '발송 중...' : '재설정 링크 전송'}
            </Button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <a
              href="/auth/login"
              className="text-sm text-blue-500 hover:underline"
            >
              로그인 페이지로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
