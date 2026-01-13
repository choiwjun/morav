'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, FileText, Globe, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { toast } from 'sonner';
import { formatDateTime, getPlatformLabel } from '@/lib/utils/dashboard';

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  publishedUrl: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  retryCount: number;
  errorMessage: string | null;
  blog: {
    id: string;
    name: string;
    platform: string;
    url: string;
  };
  keyword: string | null;
}

interface PostResponse {
  success: boolean;
  post?: Post;
  error?: string;
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const loadPost = async () => {
      try {
        const response = await fetch(`/api/posts/${resolvedParams.id}`);
        const data: PostResponse = await response.json();

        if (!data.success || !data.post) {
          toast.error(data.error || '포스트를 찾을 수 없습니다.');
          router.push('/dashboard/posts');
          return;
        }

        setPost(data.post);
        setTitle(data.post.title);
        setContent(data.post.content);
      } catch (error) {
        console.error('Load post error:', error);
        toast.error('포스트를 불러오는 중 오류가 발생했습니다.');
        router.push('/dashboard/posts');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [resolvedParams.id, router]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || '포스트 수정에 실패했습니다.');
        return;
      }

      toast.success('포스트가 수정되었습니다.');
      router.push('/dashboard/posts');
    } catch (error) {
      console.error('Save post error:', error);
      toast.error('포스트 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f9fafa] min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-[#4562a1]">포스트를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="bg-[#f9fafa] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-[#f9fafa]/95 backdrop-blur-sm border-b border-[#cdd6ea]">
        <div className="flex items-center gap-4 mb-3 sm:mb-0">
          <Link
            href="/dashboard/posts"
            className="p-2 text-[#4562a1] hover:bg-white hover:text-[#0c111d] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0c111d]">
              포스트 수정
            </h1>
            <p className="text-xs sm:text-sm text-[#4562a1]">
              포스트 내용을 수정합니다
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/posts')}
            className="border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Post Info Card */}
          <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#4562a1]" />
                </div>
                <div>
                  <p className="text-xs text-[#4562a1]">블로그</p>
                  <p className="text-sm font-medium text-[#0c111d]">
                    {post.blog.name}
                    <Badge variant="outline" className="ml-2 text-xs border-[#cdd6ea] text-[#4562a1]">
                      {getPlatformLabel(post.blog.platform)}
                    </Badge>
                  </p>
                </div>
              </div>

              {post.keyword && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
                    <Tag className="w-4 h-4 text-[#4562a1]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#4562a1]">키워드</p>
                    <p className="text-sm font-medium text-[#0c111d]">{post.keyword}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#4562a1]" />
                </div>
                <div>
                  <p className="text-xs text-[#4562a1]">상태</p>
                  <StatusBadge status={post.status} />
                </div>
              </div>

              <div className="ml-auto text-right">
                <p className="text-xs text-[#4562a1]">생성일</p>
                <p className="text-sm text-[#0c111d]">{formatDateTime(post.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-[#0c111d] mb-2">
                  제목
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="포스트 제목을 입력하세요"
                  className="border-[#cdd6ea] focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-[#0c111d] mb-2">
                  내용
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="포스트 내용을 입력하세요"
                  rows={20}
                  className="w-full px-4 py-3 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                />
                <p className="text-xs text-[#4562a1] mt-2">
                  {content.length.toLocaleString()}자
                </p>
              </div>
            </div>
          </div>

          {/* Warning for published posts */}
          {post.status === 'published' && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>참고:</strong> 이 포스트는 이미 발행되었습니다.
                여기서 수정한 내용은 모라브 시스템에만 저장되며,
                실제 블로그에 게시된 내용은 직접 블로그에서 수정해야 합니다.
              </p>
              {post.publishedUrl && (
                <a
                  href={post.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-amber-600 hover:text-amber-800 underline mt-2 inline-block"
                >
                  블로그에서 보기 →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
