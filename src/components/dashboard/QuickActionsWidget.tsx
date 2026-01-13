'use client';

import Link from 'next/link';
import { Zap, Plus, Calendar } from 'lucide-react';

export function QuickActionsWidget() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#cdd6ea] p-4 sm:p-6 shadow-sm">
      <h3 className="text-sm sm:text-base font-bold text-[#0c111d] mb-4">빠른 작업</h3>

      <div className="space-y-2 sm:space-y-3">
        <Link
          href="/dashboard/posts/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 bg-primary text-white font-bold text-xs sm:text-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          지금 발행하기
        </Link>

        <Link
          href="/settings/blogs"
          className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 border border-[#cdd6ea] text-[#0c111d] font-bold text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          블로그 추가
        </Link>

        <Link
          href="/settings/auto-generate"
          className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 border border-[#cdd6ea] text-[#0c111d] font-bold text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          자동 생성 설정
        </Link>
      </div>
    </div>
  );
}
