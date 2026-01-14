'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PostData {
  id: string;
  title: string;
  status: string;
  publishedUrl: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  } | null;
  blog: {
    platform: string;
    blogName: string;
    blogUrl: string;
  } | null;
}

interface Stats {
  total: number;
  published: number;
  failed: number;
  pending: number;
  draft: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  published: {
    label: '발행완료',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  failed: {
    label: '실패',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <XCircle className="w-4 h-4" />,
  },
  pending: {
    label: '대기중',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: <Clock className="w-4 h-4" />,
  },
  generating: {
    label: '생성중',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <Clock className="w-4 h-4" />,
  },
  generated: {
    label: '생성완료',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <FileText className="w-4 h-4" />,
  },
  publishing: {
    label: '발행중',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: <Clock className="w-4 h-4" />,
  },
  scheduled: {
    label: '예약됨',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: <Clock className="w-4 h-4" />,
  },
  draft: {
    label: '임시저장',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: <FileText className="w-4 h-4" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const platformConfig: Record<string, { label: string; color: string }> = {
    blogger: { label: '블로거', color: 'bg-blue-50 text-blue-700' },
    wordpress: { label: '워드프레스', color: 'bg-purple-50 text-purple-700' },
  };

  const config = platformConfig[platform] || { label: platform, color: 'bg-gray-50 text-gray-700' };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>{config.label}</span>
  );
}

function StatsCard({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        <p className="text-xs text-gray-500">전체</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-2xl font-bold text-green-600">{stats.published}</p>
        <p className="text-xs text-gray-500">발행완료</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        <p className="text-xs text-gray-500">실패</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        <p className="text-xs text-gray-500">대기중</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        <p className="text-xs text-gray-500">임시저장</p>
      </div>
    </div>
  );
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPosts = useCallback(async (page: number, searchQuery: string, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchQuery) params.set('search', searchQuery);
      if (status) params.set('status', status);

      const response = await fetch(`/api/admin/posts?${params}`);
      if (!response.ok) {
        throw new Error('포스트 목록을 불러올 수 없습니다.');
      }

      const data = await response.json();
      setPosts(data.posts);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(pagination.page, search, statusFilter);
  }, [pagination.page, search, statusFilter, fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="p-6 lg:p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 모니터링</h1>
        <p className="text-sm text-gray-500 mt-1">전체 포스트 발행 현황</p>
      </div>

      {/* 통계 */}
      {stats && <StatsCard stats={stats} />}

      {/* 검색 및 필터 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="제목으로 검색"
              className="pl-10"
            />
          </div>
          <Button type="submit">검색</Button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">모든 상태</option>
            <option value="published">발행완료</option>
            <option value="failed">실패</option>
            <option value="pending">대기중</option>
            <option value="generating">생성중</option>
            <option value="scheduled">예약됨</option>
            <option value="draft">임시저장</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  플랫폼
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  링크
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="animate-pulse h-6 bg-gray-200 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {search || statusFilter ? '검색 결과가 없습니다.' : '포스트가 없습니다.'}
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{post.title}</p>
                        {post.errorMessage && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="truncate">{post.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={post.status} />
                      {post.retryCount > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          (재시도 {post.retryCount}회)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {post.blog ? (
                        <div>
                          <PlatformBadge platform={post.blog.platform} />
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-[120px]">
                            {post.blog.blogName}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {post.user ? (
                        <div className="text-sm">
                          <p className="text-gray-900">{post.user.name || '이름 없음'}</p>
                          <p className="text-gray-500 text-xs truncate max-w-[150px]">
                            {post.user.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                        <br />
                        <span className="text-xs">
                          {new Date(post.createdAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.publishedUrl ? (
                        <a
                          href={post.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          보기
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
              건
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
