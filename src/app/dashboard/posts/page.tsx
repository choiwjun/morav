'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { PostsTable } from '@/components/dashboard/PostsTable';
import { toast } from 'sonner';
import { DEFAULT_POSTS_PER_PAGE } from '@/lib/constants/dashboard';

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  publishedUrl: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  blog: {
    id: string;
    name: string;
    platform: string;
  };
  keyword: string | null;
}

interface Blog {
  id: string;
  name: string;
  platform: string;
}

interface PostsResponse {
  success: boolean;
  posts?: Post[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

interface BlogsResponse {
  success: boolean;
  blogs?: Blog[];
  error?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [blogFilter, setBlogFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const loadBlogs = async () => {
    try {
      const response = await fetch('/api/user/blogs');
      const data: BlogsResponse = await response.json();

      if (data.success && data.blogs) {
        setBlogs(data.blogs);
      }
    } catch (error) {
      console.error('Load blogs error:', error);
    }
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: DEFAULT_POSTS_PER_PAGE.toString(),
        dateFilter,
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (blogFilter !== 'all') {
        params.append('blogId', blogFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/posts?${params.toString()}`);
      const data: PostsResponse = await response.json();

      if (!data.success || !data.posts) {
        toast.error(data.error || '포스트를 불러올 수 없습니다.');
        return;
      }

      setPosts(data.posts);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Load posts error:', error);
      toast.error('포스트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, blogFilter, dateFilter, searchQuery]);

  useEffect(() => {
    loadBlogs();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 검색은 debounce 처리 (엔터키 또는 검색 버튼 클릭 시)
  const handleSearch = () => {
    setCurrentPage(1);
    loadPosts();
  };

  const handleRetry = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/retry`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('포스트가 성공적으로 발행되었습니다.');
        loadPosts(); // 목록 새로고침
      } else {
        toast.error(data.error || '재시도에 실패했습니다.');
      }
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('재시도 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('정말 이 포스트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('포스트가 삭제되었습니다.');
        loadPosts(); // 목록 새로고침
      } else {
        toast.error(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">발행 관리</h1>
        <p className="text-gray-500">모든 발행 기록을 조회하고 관리하세요</p>
      </div>

      {/* 필터 바 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="제목으로 검색..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>

            {/* 블로그 필터 */}
            <select
              value={blogFilter}
              onChange={(e) => {
                setBlogFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">모든 블로그</option>
              {blogs.map((blog) => (
                <option key={blog.id} value={blog.id}>
                  {blog.name}
                </option>
              ))}
            </select>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">모든 상태</option>
              <option value="published">발행 완료</option>
              <option value="scheduled">예약 대기</option>
              <option value="pending">대기 중</option>
              <option value="generating">생성 중</option>
              <option value="publishing">발행 중</option>
              <option value="failed">발행 실패</option>
            </select>

            {/* 기간 필터 */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="all">전체</option>
              <option value="today">오늘</option>
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
            </select>

            {/* 검색 버튼 */}
            <Button onClick={handleSearch}>검색</Button>
          </div>
        </CardContent>
      </Card>

      {/* 포스트 테이블 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">포스트를 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <>
              <PostsTable posts={posts} onRetry={handleRetry} onDelete={handleDelete} />

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="p-6 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    총 {pagination.total}건 중{' '}
                    {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)}건
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      이전
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // 현재 페이지 주변 5개만 표시
                          return (
                            page === 1 ||
                            page === pagination.totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                          );
                        })
                        .map((page, index, array) => {
                          // 중간에 생략 표시
                          const showEllipsis =
                            index > 0 && array[index] - array[index - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && <span className="px-2">...</span>}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={currentPage === pagination.totalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
