'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Globe,
  Tag,
  FileText,
  Wand2,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES, getCategoryById } from '@/lib/constants/categories';

interface Blog {
  id: string;
  name: string;
  platform: string;
  url: string;
  categories: string[];
}

interface BlogsResponse {
  success: boolean;
  blogs?: Blog[];
  error?: string;
}

interface GenerateResponse {
  success: boolean;
  data?: {
    title: string;
    content: string;
    summary?: string;
    tags?: string[];
  };
  error?: string;
}

interface CreatePostResponse {
  success: boolean;
  post?: {
    id: string;
  };
  error?: string;
}

type PublishType = 'immediate' | 'scheduled' | 'draft';
type ContentTone = 'professional' | 'casual' | 'friendly' | 'formal';

export default function NewPostPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedBlog, setSelectedBlog] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string>('');
  const [tone, setTone] = useState<ContentTone>('professional');
  const [publishType, setPublishType] = useState<PublishType>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Generated content states
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);

  // Publishing state
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const response = await fetch('/api/user/blogs');
      const data: BlogsResponse = await response.json();

      if (data.success && data.blogs) {
        setBlogs(data.blogs);
        if (data.blogs.length > 0) {
          setSelectedBlog(data.blogs[0].id);
          // 첫 번째 블로그의 카테고리 자동 선택
          if (data.blogs[0].categories?.length > 0) {
            setCategory(data.blogs[0].categories[0]);
          }
        }
      }
    } catch (error) {
      console.error('Load blogs error:', error);
      toast.error('블로그 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.error('키워드를 입력해주세요.');
      return;
    }

    if (!selectedBlog) {
      toast.error('블로그를 선택해주세요.');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          category: category || undefined,
          tone,
          language: 'ko',
        }),
      });

      const data: GenerateResponse = await response.json();

      if (!data.success || !data.data) {
        toast.error(data.error || 'AI 콘텐츠 생성에 실패했습니다.');
        return;
      }

      setTitle(data.data.title);
      setContent(data.data.content);
      setIsGenerated(true);
      toast.success('콘텐츠가 생성되었습니다!');
    } catch (error) {
      console.error('Generate content error:', error);
      toast.error('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    if (!selectedBlog) {
      toast.error('블로그를 선택해주세요.');
      return;
    }

    if (publishType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        toast.error('예약 발행 시간을 설정해주세요.');
        return;
      }
    }

    setPublishing(true);

    try {
      // 예약 시간을 한국 시간(KST, UTC+9)으로 간주하고 UTC로 변환
      let scheduledAt: string | undefined;
      if (publishType === 'scheduled') {
        // 사용자 입력: "2024-01-15", "09:00" (한국 시간)
        // KST를 UTC로 변환하려면 9시간을 빼야 함
        const localDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
        // 한국 시간 기준으로 9시간을 빼서 UTC로 변환
        const utcDateTime = new Date(localDateTime.getTime() - 9 * 60 * 60 * 1000);
        scheduledAt = utcDateTime.toISOString();
      }

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogId: selectedBlog,
          title: title.trim(),
          content: content.trim(),
          keyword: keyword.trim() || undefined,
          status: publishType === 'draft' ? 'draft' : publishType === 'scheduled' ? 'scheduled' : 'pending',
          scheduledAt,
        }),
      });

      const data: CreatePostResponse = await response.json();

      if (!data.success) {
        toast.error(data.error || '포스트 생성에 실패했습니다.');
        return;
      }

      const message =
        publishType === 'draft'
          ? '임시 저장되었습니다.'
          : publishType === 'scheduled'
          ? '예약 발행이 설정되었습니다.'
          : '발행이 요청되었습니다.';

      toast.success(message);
      router.push('/dashboard/posts');
    } catch (error) {
      console.error('Publish post error:', error);
      toast.error('포스트 발행 중 오류가 발생했습니다.');
    } finally {
      setPublishing(false);
    }
  };

  const selectedBlogInfo = blogs.find((b) => b.id === selectedBlog);

  // 선택된 블로그의 카테고리 목록
  const availableCategories = selectedBlogInfo?.categories || [];

  if (loading) {
    return (
      <div className="bg-[#f9fafa] min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4562a1] mx-auto mb-4"></div>
            <p className="text-[#4562a1]">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="bg-[#f9fafa] min-h-screen">
        <header className="sticky top-0 z-10 flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-[#f9fafa]/95 backdrop-blur-sm border-b border-[#cdd6ea]">
          <Link
            href="/dashboard/posts"
            className="p-2 text-[#4562a1] hover:bg-white hover:text-[#0c111d] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0c111d]">
              새 포스트 작성
            </h1>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-2xl mx-auto p-8 border-[#cdd6ea] text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0f4ff] flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-[#4562a1]" />
            </div>
            <h2 className="text-xl font-bold text-[#0c111d] mb-2">
              연동된 블로그가 없습니다
            </h2>
            <p className="text-[#4562a1] mb-6">
              포스트를 작성하려면 먼저 블로그를 연동해주세요.
            </p>
            <Button
              onClick={() => router.push('/onboarding/connect-blog')}
              className="bg-[#4562a1] hover:bg-[#3a5289]"
            >
              블로그 연동하기
            </Button>
          </Card>
        </div>
      </div>
    );
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
              새 포스트 작성
            </h1>
            <p className="text-xs sm:text-sm text-[#4562a1]">
              AI로 콘텐츠를 생성하고 블로그에 발행하세요
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
            onClick={handlePublish}
            disabled={publishing || !title.trim() || !content.trim()}
            className="bg-[#4562a1] hover:bg-[#3a5289] flex items-center gap-2"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {publishing ? '발행 중...' : '발행하기'}
          </Button>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Step 1: 설정 */}
          <Card className="border-[#cdd6ea] shadow-sm">
            <div className="p-6 border-b border-[#e6ebf4]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#4562a1] text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0c111d]">콘텐츠 설정</h2>
                  <p className="text-sm text-[#4562a1]">블로그와 키워드를 선택하세요</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* 블로그 선택 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  블로그 선택
                </label>
                <select
                  value={selectedBlog}
                  onChange={(e) => {
                    setSelectedBlog(e.target.value);
                    const blog = blogs.find((b) => b.id === e.target.value);
                    if (blog?.categories?.length) {
                      setCategory(blog.categories[0]);
                    } else {
                      setCategory('');
                    }
                  }}
                  className="w-full px-4 py-3 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4562a1] focus:border-[#4562a1] bg-white text-[#0c111d]"
                >
                  {blogs.map((blog) => (
                    <option key={blog.id} value={blog.id}>
                      {blog.name || blog.url} ({blog.platform})
                    </option>
                  ))}
                </select>
              </div>

              {/* 키워드 입력 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  키워드
                </label>
                <Input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="예: 다이어트 식단, 주식 투자 방법, 여행 추천지"
                  className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
                />
                <p className="text-xs text-[#4562a1] mt-1">
                  AI가 이 키워드를 기반으로 콘텐츠를 생성합니다
                </p>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  카테고리
                </label>
                {availableCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((catId) => {
                      const cat = getCategoryById(catId);
                      if (!cat) return null;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                            category === cat.id
                              ? 'border-[#4562a1] bg-[#f0f4ff] text-[#4562a1]'
                              : 'border-[#cdd6ea] text-[#4562a1] hover:border-[#4562a1]'
                          }`}
                        >
                          <span className="mr-1">{cat.icon}</span>
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4562a1] focus:border-[#4562a1] bg-white text-[#0c111d]"
                  >
                    <option value="">카테고리 선택 (선택사항)</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 톤 선택 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  <Wand2 className="w-4 h-4 inline mr-2" />
                  글 톤
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'professional', label: '전문적', desc: '신뢰감 있는' },
                    { value: 'casual', label: '캐주얼', desc: '편안한' },
                    { value: 'friendly', label: '친근한', desc: '다정한' },
                    { value: 'formal', label: '격식체', desc: '공식적인' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value as ContentTone)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        tone === t.value
                          ? 'border-[#4562a1] bg-[#f0f4ff]'
                          : 'border-[#cdd6ea] hover:border-[#4562a1]'
                      }`}
                    >
                      <p className={`text-sm font-medium ${tone === t.value ? 'text-[#4562a1]' : 'text-[#0c111d]'}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-[#4562a1]">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI 생성 버튼 */}
              <Button
                onClick={handleGenerate}
                disabled={generating || !keyword.trim()}
                className="w-full bg-gradient-to-r from-[#4562a1] to-[#6b82c4] hover:from-[#3a5289] hover:to-[#5a71b3] h-12 text-base"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    AI가 콘텐츠를 생성 중입니다...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI로 콘텐츠 생성하기
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Step 2: 콘텐츠 편집 */}
          <Card className={`border-[#cdd6ea] shadow-sm ${!isGenerated && !title && !content ? 'opacity-60' : ''}`}>
            <div className="p-6 border-b border-[#e6ebf4]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isGenerated || title || content ? 'bg-[#4562a1] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0c111d]">콘텐츠 편집</h2>
                    <p className="text-sm text-[#4562a1]">생성된 콘텐츠를 확인하고 수정하세요</p>
                  </div>
                </div>
                {isGenerated && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    AI 생성 완료
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  제목
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="포스트 제목을 입력하세요"
                  className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1] text-lg font-medium"
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  내용
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="포스트 내용을 입력하세요 (마크다운 지원)"
                  rows={15}
                  className="w-full px-4 py-3 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4562a1] focus:border-[#4562a1] resize-y font-mono"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-[#4562a1]">
                    마크다운 형식을 지원합니다
                  </p>
                  <p className="text-xs text-[#4562a1]">
                    {content.length.toLocaleString()}자
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3: 발행 옵션 */}
          <Card className={`border-[#cdd6ea] shadow-sm ${!title || !content ? 'opacity-60' : ''}`}>
            <div className="p-6 border-b border-[#e6ebf4]">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  title && content ? 'bg-[#4562a1] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0c111d]">발행 옵션</h2>
                  <p className="text-sm text-[#4562a1]">발행 방식을 선택하세요</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* 발행 타입 선택 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPublishType('immediate')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    publishType === 'immediate'
                      ? 'border-[#4562a1] bg-[#f0f4ff]'
                      : 'border-[#cdd6ea] hover:border-[#4562a1]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                    publishType === 'immediate' ? 'bg-[#4562a1]' : 'bg-[#f0f4ff]'
                  }`}>
                    <Send className={`w-5 h-5 ${publishType === 'immediate' ? 'text-white' : 'text-[#4562a1]'}`} />
                  </div>
                  <p className="font-medium text-[#0c111d]">즉시 발행</p>
                  <p className="text-xs text-[#4562a1]">바로 블로그에 발행</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishType('scheduled')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    publishType === 'scheduled'
                      ? 'border-[#4562a1] bg-[#f0f4ff]'
                      : 'border-[#cdd6ea] hover:border-[#4562a1]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                    publishType === 'scheduled' ? 'bg-[#4562a1]' : 'bg-[#f0f4ff]'
                  }`}>
                    <Calendar className={`w-5 h-5 ${publishType === 'scheduled' ? 'text-white' : 'text-[#4562a1]'}`} />
                  </div>
                  <p className="font-medium text-[#0c111d]">예약 발행</p>
                  <p className="text-xs text-[#4562a1]">지정한 시간에 발행</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishType('draft')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    publishType === 'draft'
                      ? 'border-[#4562a1] bg-[#f0f4ff]'
                      : 'border-[#cdd6ea] hover:border-[#4562a1]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                    publishType === 'draft' ? 'bg-[#4562a1]' : 'bg-[#f0f4ff]'
                  }`}>
                    <FileText className={`w-5 h-5 ${publishType === 'draft' ? 'text-white' : 'text-[#4562a1]'}`} />
                  </div>
                  <p className="font-medium text-[#0c111d]">임시 저장</p>
                  <p className="text-xs text-[#4562a1]">나중에 발행</p>
                </button>
              </div>

              {/* 예약 발행 시간 설정 */}
              {publishType === 'scheduled' && (
                <div className="p-4 bg-[#f0f4ff] rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[#4562a1]" />
                    <p className="text-sm font-medium text-[#0c111d]">예약 시간 설정</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#4562a1] mb-1">날짜</label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#4562a1] mb-1">시간</label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 안내 카드 */}
          <Card className="p-6 bg-[#f0f4ff] border-[#cdd6ea]">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-[#4562a1]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#0c111d] mb-1">발행 전 확인사항</h4>
                <ul className="text-sm text-[#4562a1] space-y-1">
                  <li>• AI가 생성한 콘텐츠는 반드시 검토 후 발행해주세요</li>
                  <li>• 발행된 포스트는 블로그에서 직접 수정/삭제해야 합니다</li>
                  <li>• 월 발행 한도를 확인해주세요</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
