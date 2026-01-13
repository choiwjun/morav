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

// 카테고리 ID를 한글 이름으로 변환
const CATEGORY_NAMES: Record<string, string> = {
  health: '건강',
  tech: 'IT',
  it: 'IT',
  parenting: '육아',
  business: '경제',
  education: '교육',
  lifestyle: '라이프',
  travel: '여행',
  food: '음식',
  fashion: '패션',
  entertainment: '엔터',
  sports: '스포츠',
  automotive: '자동차',
  gaming: '게임',
  other: '기타',
};

const getCategoryName = (category: string): string => {
  return CATEGORY_NAMES[category] || category;
};

export function TrendingKeywordsWidget({ keywords }: TrendingKeywordsWidgetProps) {
  if (keywords.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#cdd6ea] overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e6ebf4] flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0c111d]">실시간 인기 키워드</h3>
            <p className="text-xs sm:text-sm text-[#4562a1] mt-0.5">트렌드 키워드</p>
          </div>
          <Link
            href="/dashboard/keywords"
            className="text-xs sm:text-sm font-medium text-primary hover:underline"
          >
            더보기
          </Link>
        </div>
        <div className="px-4 sm:px-6 py-8 text-center text-gray-500 text-sm">
          수집된 키워드가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#cdd6ea] overflow-hidden shadow-sm">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e6ebf4] flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0c111d]">실시간 인기 키워드</h3>
          <p className="text-xs sm:text-sm text-[#4562a1] mt-0.5">트렌드 키워드</p>
        </div>
        <Link
          href="/dashboard/keywords"
          className="text-xs sm:text-sm font-medium text-primary hover:underline"
        >
          더보기
        </Link>
      </div>

      <div className="divide-y divide-[#e6ebf4]">
        {keywords.slice(0, 5).map((keyword, index) => (
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
                <span>{getCategoryName(keyword.category)}</span>
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
