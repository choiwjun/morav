'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Tag, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { CATEGORIES, getCategoryById } from '@/lib/constants/categories';
import { StoredKeyword } from '@/lib/keywords/types';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/lib/utils/dashboard';
import { DEFAULT_KEYWORDS_LIMIT } from '@/lib/constants/dashboard';

interface KeywordsResponse {
  success: boolean;
  keywords?: StoredKeyword[];
  total?: number;
  error?: string;
}

function getSourceLabel(source: 'naver' | 'google'): string {
  return source === 'naver' ? '네이버' : '구글';
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<StoredKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'trending'>('recent');

  const loadKeywords = async () => {
    try {
      const params = new URLSearchParams({
        limit: DEFAULT_KEYWORDS_LIMIT.toString(),
        sortBy: sortOrder,
      });

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const response = await fetch(`/api/keywords?${params.toString()}`);
      const data: KeywordsResponse = await response.json();

      if (!data.success || !data.keywords) {
        toast.error(data.error || '키워드를 불러올 수 없습니다.');
        return;
      }

      setKeywords(data.keywords);
    } catch (error) {
      console.error('Load keywords error:', error);
      toast.error('키워드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadKeywords();
  }, [categoryFilter, sortOrder]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadKeywords();
  };

  const handleGenerateFromKeyword = (keyword: StoredKeyword) => {
    // TODO: 향후 콘텐츠 생성 기능 구현
    toast.info(`"${keyword.keyword}" 키워드로 콘텐츠 생성 기능은 곧 제공될 예정입니다.`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">인기 키워드 탐색</h1>
          <p className="text-gray-500">
            실시간 트렌드 키워드로 즉시 콘텐츠 생성
          </p>
        </div>

        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin mr-2' : 'mr-2'} />
          새로고침
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">모든 카테고리</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'recent' | 'trending')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">최신순</option>
          <option value="trending">인기순</option>
        </select>
      </div>

      {/* 키워드 리스트 */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">키워드를 불러오는 중...</p>
          </div>
        </div>
      ) : keywords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">표시할 키워드가 없습니다.</p>
            <Button variant="outline" onClick={handleRefresh}>
              새로고침
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keywords.map((keyword, index) => {
            const category = getCategoryById(keyword.category);
            return (
              <Card key={keyword.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-6">
                  {/* 순위 */}
                  <div className="text-4xl font-bold text-gray-200 flex-shrink-0 w-16 text-center">
                    #{index + 1}
                  </div>

                  {/* 키워드 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">
                      {keyword.keyword}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Tag size={14} />
                        {category?.name || keyword.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp size={14} />
                        {keyword.trendScore.toLocaleString()} 검색
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatTimeAgo(keyword.collectedAt)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getSourceLabel(keyword.source)}
                      </Badge>
                    </div>
                  </div>

                  {/* 액션 */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="default"
                      onClick={() => handleGenerateFromKeyword(keyword)}
                    >
                      <Sparkles size={16} className="mr-2" />
                      콘텐츠 생성
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
