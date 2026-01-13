'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { UserCircle, Camera, Lock, Trash2, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 프로필 사진 업로드 핸들러
  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('파일 크기는 2MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 검증
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast.error('JPG, PNG, WebP 파일만 업로드 가능합니다.');
      return;
    }

    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '프로필 사진 업로드에 실패했습니다.');
      }

      setAvatarUrl(data.avatarUrl);
      toast.success('프로필 사진이 변경되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로필 사진 업로드에 실패했습니다.');
    } finally {
      setAvatarLoading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 프로필 사진 삭제 핸들러
  const handlePhotoDelete = async () => {
    if (!avatarUrl) return;

    setAvatarLoading(true);
    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '프로필 사진 삭제에 실패했습니다.');
      }

      setAvatarUrl(null);
      toast.success('프로필 사진이 삭제되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로필 사진 삭제에 실패했습니다.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // 프로필 데이터 로드
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (response.ok && data.profile) {
          setFormData({
            name: data.profile.name || '',
            email: data.profile.email || '',
          });
          setAvatarUrl(data.profile.avatar_url || null);
        } else if (response.status === 401) {
          router.push('/auth/login');
        }
      } catch {
        toast.error('프로필을 불러오는데 실패했습니다.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      toast.success('프로필이 저장되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
    return { valid: true };
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // 비밀번호 복잡성 검증
    const passwordValidation = validatePassword(passwordFormData.newPassword);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.error || '비밀번호 형식이 올바르지 않습니다.');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
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

      toast.success('비밀번호가 변경되었습니다.');
      setShowPasswordModal(false);
      setPasswordFormData({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '계정 삭제에 실패했습니다.');
      }

      toast.success('계정이 삭제되었습니다.');
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '계정 삭제에 실패했습니다.');
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-[#cdd6ea]">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-200"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-8 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 프로필 정보 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4]">
          <div className="flex items-center gap-3">
            <UserCircle className="w-6 h-6 text-[#4562a1]" />
            <h2 className="text-lg font-semibold text-[#0c111d]">프로필 정보</h2>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          {/* 프로필 사진 */}
          <div>
            <label className="block text-sm font-medium text-[#0c111d] mb-3">
              프로필 사진
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <div className="w-20 h-20 rounded-full border-2 border-[#cdd6ea] overflow-hidden relative">
                    <Image
                      src={avatarUrl}
                      alt="프로필 사진"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {avatarLoading && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#f0f4ff] flex items-center justify-center border-2 border-[#cdd6ea] relative">
                    <UserCircle className="w-12 h-12 text-[#4562a1]" />
                    {avatarLoading && (
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#4562a1] text-white flex items-center justify-center hover:bg-[#3a5289] transition-colors disabled:opacity-50"
                >
                  <Camera size={14} />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarLoading}
                    className="border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
                  >
                    {avatarLoading ? '업로드 중...' : '사진 변경'}
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={handlePhotoDelete}
                      disabled={avatarLoading}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X size={14} className="mr-1" />
                      삭제
                    </Button>
                  )}
                </div>
                <p className="text-xs text-[#4562a1]">
                  JPG, PNG, WebP 파일 (최대 2MB)
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#0c111d] mb-2">
              이름
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="max-w-md border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
              placeholder="이름을 입력하세요"
            />
          </div>

          {/* 이메일 (읽기 전용) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#0c111d] mb-2">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="max-w-md bg-[#f9fafa] text-[#4562a1] border-[#cdd6ea]"
            />
            <p className="text-xs text-[#4562a1] mt-1">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end pt-4 border-t border-[#e6ebf4]">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#4562a1] hover:bg-[#3a5289]"
            >
              {loading ? '저장 중...' : '변경사항 저장'}
            </Button>
          </div>
        </form>
      </Card>

      {/* 비밀번호 변경 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4]">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-[#4562a1]" />
            <h2 className="text-lg font-semibold text-[#0c111d]">비밀번호</h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-[#4562a1] mb-4">
            보안을 위해 주기적으로 비밀번호를 변경하는 것을 권장합니다.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowPasswordModal(true)}
            className="border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
          >
            <Lock size={16} className="mr-2" />
            비밀번호 변경
          </Button>
        </div>
      </Card>

      {/* 계정 삭제 카드 */}
      <Card className="border-red-200 shadow-sm bg-red-50/50">
        <div className="p-6 border-b border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600">위험 영역</h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-red-600 mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="border-red-300 text-red-600 hover:bg-red-100"
          >
            <Trash2 size={16} className="mr-2" />
            계정 삭제하기
          </Button>
        </div>
      </Card>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-[#cdd6ea] shadow-xl">
            <div className="p-6 border-b border-[#e6ebf4]">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-[#4562a1]" />
                <h3 className="text-xl font-bold text-[#0c111d]">비밀번호 변경</h3>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#0c111d] mb-2">
                  새 비밀번호
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  required
                  minLength={8}
                  className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
                  placeholder="8자 이상, 대소문자, 숫자 포함"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0c111d] mb-2">
                  새 비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                  className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
                  placeholder="비밀번호 재입력"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e6ebf4]">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordFormData({ newPassword: '', confirmPassword: '' });
                  }}
                  className="border-[#cdd6ea]"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-[#4562a1] hover:bg-[#3a5289]"
                >
                  {passwordLoading ? '변경 중...' : '변경'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 계정 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-red-200 shadow-xl">
            <div className="p-6 border-b border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-red-600">계정 삭제 확인</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[#0c111d] mb-4">
                정말로 계정을 삭제하시겠습니까?
              </p>
              <ul className="text-sm text-red-600 space-y-1 mb-6 list-disc list-inside">
                <li>모든 발행된 포스트 기록이 삭제됩니다</li>
                <li>연동된 블로그 정보가 삭제됩니다</li>
                <li>저장된 API 키가 삭제됩니다</li>
                <li>이 작업은 되돌릴 수 없습니다</li>
              </ul>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="border-[#cdd6ea]"
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 size={16} className="mr-2" />
                  계정 삭제
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
