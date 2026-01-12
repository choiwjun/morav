'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatTimeAgo, getPlatformLabel } from '@/lib/utils/dashboard';
import { FileText, Clock, CheckCircle, MoreHorizontal, ExternalLink, Tag } from 'lucide-react';

interface RecentPost {
  id: string;
  title: string;
  content?: string;
  status: string;
  blogName: string;
  blogPlatform: string;
  keyword?: string | null;
  publishedUrl?: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface RecentPostsListProps {
  posts: RecentPost[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'published':
      return <CheckCircle className="w-5 h-5 text-primary" />;
    case 'scheduled':
      return <Clock className="w-5 h-5 text-primary" />;
    case 'generating':
      return <FileText className="w-5 h-5 text-primary animate-pulse" />;
    default:
      return <FileText className="w-5 h-5 text-primary" />;
  }
}

export function RecentPostsList({ posts }: RecentPostsListProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#cdd6ea] overflow-hidden flex flex-col shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b border-[#e6ebf4] flex items-center justify-between">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#0c111d]">최근 발행 목록</h3>
        <Link
          href="/dashboard/posts"
          className="text-xs sm:text-sm font-medium text-primary hover:underline"
        >
          전체 보기
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-[#e6ebf4]">
        {posts.length === 0 ? (
          <div className="px-4 sm:px-8 py-8 sm:py-12 text-center text-[#4562a1] text-sm">
            발행된 포스트가 없습니다.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="hidden sm:flex size-10 rounded-lg bg-[#e6ebf4] items-center justify-center flex-shrink-0 mt-0.5">
                  {getStatusIcon(post.status)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* 키워드 배지 및 블로그 정보 */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {post.keyword && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] sm:text-xs font-medium rounded-full">
                        <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {post.keyword}
                      </span>
                    )}
                    <span className="text-[10px] sm:text-xs text-[#4562a1]">
                      {getPlatformLabel(post.blogPlatform)} · {post.blogName}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h4 className="text-sm sm:text-base font-bold text-[#0c111d] group-hover:text-primary transition-colors line-clamp-1 mb-1">
                    {post.title}
                  </h4>

                  {/* 콘텐츠 미리보기 */}
                  {post.content && (
                    <p className="text-xs sm:text-sm text-[#4562a1] line-clamp-2 mb-2">
                      {post.content}
                    </p>
                  )}

                  {/* 하단 정보 */}
                  <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-[#4562a1]">
                    <span>{formatTimeAgo(post.publishedAt || post.createdAt)}</span>
                    {post.publishedUrl && (
                      <a
                        href={post.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        블로그에서 보기
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* 우측: 상태 배지 및 더보기 */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <StatusBadge status={post.status} />
                  <button className="hidden sm:block p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
