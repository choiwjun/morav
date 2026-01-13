'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Tag,
  TrendingUp,
  Clock,
  Sparkles,
  X,
  Search,
  Filter,
  Hash,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  // 검색 필터링
  const filteredKeywords = keywords.filter((keyword) =>
    searchQuery.trim()
      ? keyword.keyword.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true
  );

  // 통계 계산
  const totalKeywords = keywords.length;
  const naverCount = keywords.filter((k) => k.source === 'naver').length;
  const googleCount = keywords.filter((k) => k.source === 'google').length;

  return (
    <div className="bg-[#f9fafa] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-[#f9fafa]/95 backdrop-blur-sm">
        <div className="flex flex-col gap-0.5 mb-3 sm:mb-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0c111d]">
            인기 키워드 탐색
          </h1>
          <p className="text-xs sm:text-sm text-[#4562a1]">
            실시간 트렌드 키워드로 즉시 콘텐츠 생성
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin mr-2' : 'mr-2'} />
          새로고침
        </Button>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
                <Hash className="w-5 h-5 text-[#4562a1]" />
              </div>
              <div>
                <p className="text-xs text-[#4562a1] font-medium">전체 키워드</p>
                <p className="text-xl font-bold text-[#0c111d]">{totalKeywords}개</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <span className="text-sm font-bold text-[#07883d]">N</span>
              </div>
              <div>
                <p className="text-xs text-[#4562a1] font-medium">네이버</p>
                <p className="text-xl font-bold text-[#07883d]">{naverCount}개</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-500">G</span>
              </div>
              <div>
                <p className="text-xs text-[#4562a1] font-medium">구글</p>
                <p className="text-xl font-bold text-blue-500">{googleCount}개</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4562a1]" size={18} />
              <Input
                type="text"
                placeholder="키워드 검색..."
                className="pl-10 border-[#cdd6ea] focus:border-primary focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* 카테고리 필터 */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-[#0c111d] min-w-[150px]"
              >
                <option value="all">모든 카테고리</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              {/* 정렬 */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'recent' | 'trending')}
                className="px-4 py-2 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-[#0c111d] min-w-[120px]"
              >
                <option value="recent">최신순</option>
                <option value="trending">인기순</option>
              </select>

              {/* 필터 적용 버튼 */}
              <Button onClick={handleRefresh} className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                필터 적용
              </Button>
            </div>
          </div>
        </div>

        {/* Keywords List */}
        <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-[#4562a1]">키워드를 불러오는 중...</p>
              </div>
            </div>
          ) : filteredKeywords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Hash className="w-12 h-12 text-[#cdd6ea] mb-4" />
              <p className="text-[#4562a1] mb-4">표시할 키워드가 없습니다.</p>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
              >
                새로고침
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[#cdd6ea]">
              {filteredKeywords.map((keyword, index) => {
                const category = getCategoryById(keyword.category);
                return (
                  <div
                    key={keyword.id}
                    className="p-4 sm:p-6 hover:bg-[#f9fafa] transition-colors"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      {/* 순위 */}
                      <div className="hidden sm:flex w-12 h-12 rounded-xl bg-[#f0f4ff] items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-[#4562a1]">
                          {index + 1}
                        </span>
                      </div>

                      {/* 키워드 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="sm:hidden text-sm font-bold text-[#4562a1]">
                            #{index + 1}
                          </span>
                          <h3 className="text-base sm:text-lg font-semibold text-[#0c111d] truncate">
                            {keyword.keyword}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#4562a1] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Tag size={14} />
                            {category?.name || keyword.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={14} />
                            {keyword.trendScore.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 hidden sm:flex">
                            <Clock size={14} />
                            {formatTimeAgo(keyword.collectedAt)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs border-[#cdd6ea] ${
                              keyword.source === 'naver'
                                ? 'text-[#07883d] bg-green-50'
                                : 'text-blue-500 bg-blue-50'
                            }`}
                          >
                            {getSourceLabel(keyword.source)}
                          </Badge>
                        </div>
                      </div>

                      {/* 액션 */}
                      <div className="flex-shrink-0">
                        <Button
                          onClick={() => handleGenerateFromKeyword(keyword)}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <Sparkles size={16} />
                          <span className="hidden sm:inline">콘텐츠 생성</span>
                          <span className="sm:hidden">생성</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 콘텐츠 생성 모달 */}
      {showGenerateModal && selectedKeyword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#0c111d]">콘텐츠 생성</h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-2 text-[#4562a1] hover:bg-[#f0f4ff] rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0c111d] mb-2">
                    키워드
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-[#f0f4ff] rounded-lg">
                    <Tag size={16} className="text-[#4562a1]" />
                    <span className="text-[#0c111d] font-semibold">
                      {selectedKeyword.keyword}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0c111d] mb-2">
                    발행할 블로그
                  </label>
                  <select
                    value={selectedBlogId}
                    onChange={(e) => setSelectedBlogId(e.target.value)}
                    className="w-full px-4 py-3 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-[#0c111d]"
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
                    className="flex-1 border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
