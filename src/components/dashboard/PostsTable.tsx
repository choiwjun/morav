'use client';

import { useRouter } from 'next/navigation';
import { FileText, Eye, RefreshCw, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatDateTime, getPlatformLabel, getContentExcerpt } from '@/lib/utils/dashboard';

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

interface PostsTableProps {
  posts: Post[];
  onRetry?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostsTable({ posts, onRetry, onDelete }: PostsTableProps) {
  const router = useRouter();

  const handleEdit = (postId: string) => {
    router.push(`/dashboard/posts/${postId}/edit`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#f9fafa] border-b border-[#cdd6ea]">
          <tr>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#0c111d]">
              제목
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#0c111d] hidden md:table-cell">
              블로그
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#0c111d] hidden lg:table-cell">
              키워드
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#0c111d]">
              상태
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#0c111d] hidden sm:table-cell">
              시간
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#0c111d]">
              액션
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#cdd6ea]">
          {posts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-[#4562a1]">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-[#cdd6ea]" />
                  <p>표시할 포스트가 없습니다.</p>
                </div>
              </td>
            </tr>
          ) : (
            posts.map((post) => (
              <tr key={post.id} className="hover:bg-[#f9fafa] transition-colors">
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f0f4ff] flex items-center justify-center flex-shrink-0 hidden sm:flex">
                      <FileText size={16} className="text-[#4562a1]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#0c111d] line-clamp-1 text-sm">
                        {post.title}
                      </p>
                      <p className="text-xs text-[#4562a1] line-clamp-1 mt-0.5">
                        {getContentExcerpt(post.content)}
                      </p>
                      {/* 모바일에서 블로그 정보 표시 */}
                      <div className="flex items-center gap-2 mt-1 md:hidden">
                        <Badge variant="outline" className="text-[10px] border-[#cdd6ea] text-[#4562a1]">
                          {getPlatformLabel(post.blog.platform)}
                        </Badge>
                        <span className="text-xs text-[#4562a1]">{post.blog.name}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-[#cdd6ea] text-[#4562a1]">
                      {getPlatformLabel(post.blog.platform)}
                    </Badge>
                    <span className="text-sm text-[#0c111d]">{post.blog.name}</span>
                  </div>
                </td>

                <td className="px-4 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                  {post.keyword ? (
                    <Badge variant="outline" className="text-xs border-[#cdd6ea] text-[#4562a1]">
                      {post.keyword}
                    </Badge>
                  ) : (
                    <span className="text-sm text-[#cdd6ea]">-</span>
                  )}
                </td>

                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <StatusBadge status={post.status} />
                </td>

                <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-[#4562a1] hidden sm:table-cell">
                  {formatDateTime(post.publishedAt || post.scheduledAt || post.createdAt)}
                </td>

                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-1">
                    {/* 수정 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(post.id)}
                      className="h-8 w-8 p-0 text-[#4562a1] hover:text-[#0c111d] hover:bg-[#f0f4ff]"
                      title="수정"
                    >
                      <Edit size={16} />
                    </Button>
                    {post.publishedUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(post.publishedUrl!, '_blank')}
                        className="h-8 w-8 p-0 text-[#4562a1] hover:text-[#0c111d] hover:bg-[#f0f4ff]"
                        title="블로그에서 보기"
                      >
                        <Eye size={16} />
                      </Button>
                    )}
                    {post.status === 'failed' && onRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(post.id)}
                        className="h-8 w-8 p-0 text-[#4562a1] hover:text-[#0c111d] hover:bg-[#f0f4ff]"
                        title="재시도"
                      >
                        <RefreshCw size={16} />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(post.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
