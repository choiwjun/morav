'use client';

import { FileText, Eye, RefreshCw, Trash2 } from 'lucide-react';
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
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              제목
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              블로그
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              키워드
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              상태
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              시간
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              액션
            </th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {posts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                표시할 포스트가 없습니다.
              </td>
            </tr>
          ) : (
            posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                        {getContentExcerpt(post.content)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getPlatformLabel(post.blog.platform)}
                    </Badge>
                    <span className="text-sm text-gray-700">{post.blog.name}</span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  {post.keyword ? (
                    <Badge variant="outline" className="text-xs">
                      {post.keyword}
                    </Badge>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <StatusBadge status={post.status} />
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDateTime(post.publishedAt || post.scheduledAt || post.createdAt)}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {post.publishedUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(post.publishedUrl!, '_blank')}
                        className="h-8 w-8 p-0"
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
                        className="h-8 w-8 p-0"
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
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
