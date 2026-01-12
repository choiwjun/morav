'use client';

import Link from 'next/link';
import { TrendingUp, Sparkles } from 'lucide-react';

interface TrendingKeyword {
  id: string;
  keyword: string;
  category: string;
  trendingScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendingKeywordsWidgetProps {
  keywords: TrendingKeyword[];
}

export function TrendingKeywordsWidget({ keywords }: TrendingKeywordsWidgetProps) {
  // 임시 데이터 (실제로는 props로 받아야 함)
  const defaultKeywords: TrendingKeyword[] = [
    { id: '1', keyword: '건강 다이어트 방법', category: '건강', trendingScore: 12500, trend: 'up' },
    { id: '2', keyword: '2024 IT 트렌드', category: 'IT', trendingScore: 8300, trend: 'up' },
    { id: '3', keyword: '홈 인테리어 팁', category: '라이프', trendingScore: 6200, trend: 'stable' },
  ];

  const displayKeywords = keywords.length > 0 ? keywords : defaultKeywords;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#cdd6ea] overflow-hidden shadow-sm">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e6ebf4] flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0c111d]">실시간 인기 키워드</h3>
          <p className="text-xs sm:text-sm text-[#4562a1] mt-0.5">선택한 카테고리의 트렌드 키워드</p>
        </div>
        <Link
          href="/dashboard/keywords"
          className="text-xs sm:text-sm font-medium text-primary hover:underline"
        >
          더보기
        </Link>
      </div>

      <div className="divide-y divide-[#e6ebf4]">
        {displayKeywords.slice(0, 5).map((keyword, index) => (
          <div
            key={keyword.id}
            className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <span className="text-xl sm:text-2xl font-bold text-gray-200 w-6 sm:w-8 text-center flex-shrink-0">
              #{index + 1}
            </span>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-[#0c111d] group-hover:text-primary transition-colors truncate">
                {keyword.keyword}
              </h4>
              <p className="text-[10px] sm:text-xs text-[#4562a1] flex items-center gap-2">
                <span>{keyword.category}</span>
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  {keyword.trendingScore.toLocaleString()} 검색
                </span>
              </p>
            </div>

            <button className="flex-shrink-0 p-1.5 sm:p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
