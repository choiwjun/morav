'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Tag, TrendingUp, Clock, Sparkles, X } from 'lucide-react';
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

interface Blog {
  id: string;
  blog_name: string;
  platform: string;
}

interface BlogsResponse {
  success: boolean;
  blogs?: Blog[];
  error?: string;
}

function getSourceLabel(source: 'naver' | 'google'): string {
  return source === 'naver' ? '네이버' : '구글';
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<StoredKeyword[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'trending'>('recent');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<StoredKeyword | null>(null);
  const [selectedBlogId, setSelectedBlogId] = useState<string>('');
  const [generating, setGenerating] = useState(false);

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

  const loadBlogs = async () => {
    try {
      const response = await fetch('/api/user/blogs');
      const data: BlogsResponse = await response.json();

      if (data.success && data.blogs) {
        setBlogs(data.blogs);
        if (data.blogs.length > 0) {
          setSelectedBlogId(data.blogs[0].id);
        }
      }
    } catch (error) {
      console.error('Load blogs error:', error);
    }
  };

  useEffect(() => {
    loadKeywords();
    loadBlogs();
  }, [categoryFilter, sortOrder]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadKeywords();
  };

  const handleGenerateFromKeyword = (keyword: StoredKeyword) => {
    if (blogs.length === 0) {
      toast.error('먼저 블로그를 연결해주세요.');
      return;
    }
    setSelectedKeyword(keyword);
    setShowGenerateModal(true);
  };

  const handleGenerate = async () => {
    if (!selectedKeyword || !selectedBlogId) {
      toast.error('키워드와 블로그를 선택해주세요.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: selectedKeyword.keyword,
          keywordId: selectedKeyword.id,
          blogId: selectedBlogId,
          category: selectedKeyword.category,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('콘텐츠가 생성되었습니다! 발행 관리에서 확인하세요.');
        setShowGenerateModal(false);
      } else {
        toast.error(data.error || '콘텐츠 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
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

      {/* 콘텐츠 생성 모달 */}
      {showGenerateModal && selectedKeyword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">콘텐츠 생성</h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    키워드
                  </label>
                  <p className="text-gray-900 font-semibold">{selectedKeyword.keyword}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    발행할 블로그
                  </label>
                  <select
                    value={selectedBlogId}
                    onChange={(e) => setSelectedBlogId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {blogs.map((blog) => (
                      <option key={blog.id} value={blog.id}>
                        {blog.blog_name} ({blog.platform})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowGenerateModal(false)}
                    disabled={generating}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="mr-2" />
                        생성하기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
