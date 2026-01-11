'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Globe, FileText, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES } from '@/lib/constants/categories';

interface Blog {
  id: string;
  name: string;
  url: string;
  platform: 'tistory' | 'blogger' | 'wordpress';
  categories: string[];
  is_active: boolean;
  created_at: string;
}

interface BlogsResponse {
  success: boolean;
  blogs?: Blog[];
  error?: string;
}

const MAX_BLOGS = 3;

const PLATFORM_INFO = {
  tistory: {
    name: '티스토리',
    icon: '📝',
    color: 'bg-green-50',
  },
  blogger: {
    name: '구글 블로그',
    icon: '🔵',
    color: 'bg-blue-50',
  },
  wordpress: {
    name: '워드프레스',
    icon: '⚙️',
    color: 'bg-purple-50',
  },
};

function getCategoryName(categoryId: string): string {
  const category = CATEGORIES.find((cat) => cat.id === categoryId);
  return category?.name || categoryId;
}

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const response = await fetch('/api/user/blogs');
      const data: BlogsResponse = await response.json();

      if (!data.success || !data.blogs) {
        toast.error(data.error || '블로그 목록을 불러올 수 없습니다.');
        return;
      }

      setBlogs(data.blogs);
    } catch (error) {
      console.error('Load blogs error:', error);
      toast.error('블로그 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId: string, blogName: string) => {
    if (!confirm(`"${blogName}" 블로그 연결을 해제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/blogs/${blogId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || '블로그 연결 해제에 실패했습니다.');
        return;
      }

      toast.success('블로그 연결이 해제되었습니다.');
      loadBlogs();
    } catch (error) {
      console.error('Delete blog error:', error);
      toast.error('블로그 연결 해제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (_blogId: string) => {
    // TODO: 블로그 수정 모달 또는 페이지로 이동
    toast.info('블로그 수정 기능은 곧 제공될 예정입니다.');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">블로그 관리</h1>
          <p className="text-gray-500 mt-1">
            연동된 블로그: {blogs.length}/{MAX_BLOGS}
          </p>
        </div>

        {blogs.length < MAX_BLOGS && (
          <Button
            variant="default"
            onClick={() => router.push('/onboarding/connect-blog')}
          >
            <Plus size={16} className="mr-2" />
            블로그 추가
          </Button>
        )}
      </div>

      {/* 블로그 리스트 */}
      {blogs.length > 0 ? (
        <div className="space-y-4">
          {blogs.map((blog) => {
            const platformInfo = PLATFORM_INFO[blog.platform];

            return (
              <Card key={blog.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* 플랫폼 아이콘 */}
                    <div className={`p-3 ${platformInfo.color} rounded-lg`}>
                      <span className="text-2xl">{platformInfo.icon}</span>
                    </div>

                    {/* 블로그 정보 */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {blog.url}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 flex-wrap">
                        {blog.categories.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            {blog.categories.map(getCategoryName).join(', ')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <FileText size={14} />
                            카테고리 없음
                          </span>
                        )}
                      </div>

                      {/* 상태 */}
                      <Badge
                        variant={blog.is_active ? 'default' : 'secondary'}
                        className={
                          blog.is_active
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }
                      >
                        {blog.is_active ? '활성화' : '비활성화'}
                      </Badge>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(blog.id)}
                    >
                      <Edit size={14} className="mr-1" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(blog.id, blog.url)}
                    >
                      <Trash2 size={14} className="mr-1" />
                      연동 해제
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* 빈 상태 */
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Globe size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">
            연동된 블로그가 없습니다
          </h3>
          <p className="text-gray-500 mb-6">
            블로그를 추가하고 자동 발행을 시작하세요
          </p>
          <Button
            variant="default"
            onClick={() => router.push('/onboarding/connect-blog')}
          >
            <Plus size={16} className="mr-2" />
            블로그 추가하기
          </Button>
        </Card>
      )}
    </div>
  );
}