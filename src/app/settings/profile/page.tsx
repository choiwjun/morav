'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '홍길동',
    email: 'hong@example.com',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // TODO: API 연동 (2.4.6 태스크 완료 후)
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 저장에 실패했습니다.');
      }

      setSuccess('프로필이 저장되었습니다.');
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 비밀번호 검증
    if (passwordFormData.newPassword.length < 8) {
      setError('비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setPasswordLoading(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: passwordFormData.newPassword,
      });

      if (error) {
        throw new Error(error.message || '비밀번호 변경에 실패했습니다.');
      }

      setSuccess('비밀번호가 변경되었습니다.');
      setShowPasswordModal(false);
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 계정을 삭제하시겠습니까?\n모든 데이터가 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message || '로그아웃에 실패했습니다.');
      }

      // 계정 삭제 후 랜딩페이지로 이동
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '계정 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">프로필 설정</h1>

      {/* 성공 메시지 */}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* 프로필 사진 */}
        <div>
          <label className="block text-sm font-medium mb-3">프로필 사진</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <Button variant="outline" size="sm" type="button">
                사진 변경
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG 파일 (최대 2MB)
              </p>
            </div>
          </div>
        </div>

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
            className="max-w-md"
          />
        </div>

        {/* 이메일 (읽기 전용) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            이메일
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            disabled
            className="max-w-md bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            이메일은 변경할 수 없습니다
          </p>
        </div>

        {/* 비밀번호 변경 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            비밀번호
          </label>
          <Button
            variant="outline"
            type="button"
            onClick={() => setShowPasswordModal(true)}
          >
            비밀번호 변경
          </Button>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>

      {/* 계정 삭제 섹션 */}
      <div className="border-t pt-8 mt-12">
        <h3 className="text-lg font-semibold text-red-600 mb-2">위험 영역</h3>
        <p className="text-sm text-gray-600 mb-4">
          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <Button
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50"
          type="button"
          onClick={handleDeleteAccount}
        >
          계정 삭제하기
        </Button>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">비밀번호 변경</h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* 현재 비밀번호 */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  현재 비밀번호
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                  required
                />
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  새 비밀번호
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  새 비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordFormData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  취소
                </Button>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? '변경 중...' : '변경'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
