'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatTimeAgo, getPlatformLabel } from '@/lib/utils/dashboard';

interface RecentPost {
  id: string;
  title: string;
  status: string;
  blogName: string;
  blogPlatform: string;
  publishedAt: string | null;
  createdAt: string;
}

interface RecentPostsListProps {
  posts: RecentPost[];
}

export function RecentPostsList({ posts }: RecentPostsListProps) {
  return (
    <Card>
      <CardHeader className="border-b flex flex-row items-center justify-between">
        <CardTitle>최근 발행 목록</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/posts">전체 보기</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {posts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              발행된 포스트가 없습니다.
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getPlatformLabel(post.blogPlatform)}
                      </Badge>
                      <span className="text-xs text-gray-500 truncate">
                        {post.blogName}
                      </span>
                    </div>

                    <h3 className="font-semibold mb-1 line-clamp-1 text-gray-900">
                      {post.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                      <span>{formatTimeAgo(post.publishedAt || post.createdAt)}</span>
                    </div>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    <StatusBadge status={post.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
