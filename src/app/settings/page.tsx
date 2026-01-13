'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // 설정 메인 페이지 접근 시 프로필 페이지로 리다이렉트
    router.replace('/settings/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-[#4562a1]">
        설정 페이지로 이동 중...
      </div>
    </div>
  );
}
