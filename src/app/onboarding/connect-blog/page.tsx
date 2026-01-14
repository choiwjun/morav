'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type BlogPlatform = 'blogger' | 'wordpress' | null;

interface ConnectedBlog {
  id: string;
  platform: 'blogger' | 'wordpress';
  blogName: string;
  blogUrl: string;
  connectedAt: string;
}

// OAuth 결과를 처리하는 컴포넌트 (useSearchParams 사용)
function OAuthResultHandler({
  onSuccess,
  onError
}: {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (successParam === 'blogger') {
      onSuccess('구글 블로거가 연결되었습니다.');
      window.history.replaceState({}, '', '/onboarding/connect-blog');
    }

    if (errorParam) {
      onError(decodeURIComponent(errorParam));
      window.history.replaceState({}, '', '/onboarding/connect-blog');
    }
  }, [searchParams, onSuccess, onError]);

  return null;
}

export default function ConnectBlogPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<BlogPlatform>(null);
  const [connectedBlogs, setConnectedBlogs] = useState<ConnectedBlog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 페이지 로드 시 연결된 블로그 목록 가져오기
  useEffect(() => {
    fetchConnectedBlogs();
  }, []);

  const handleOAuthSuccess = (message: string) => {
    setSuccess(message);
    fetchConnectedBlogs();
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleOAuthError = (message: string) => {
    setError(message);
  };

  const fetchConnectedBlogs = async () => {
    try {
      const response = await fetch('/api/blog/list');
      if (response.ok) {
        const data = await response.json();
        if (data.blogs) {
          setConnectedBlogs(data.blogs.map((blog: { id: string; platform: string; blog_name: string; blog_url: string; created_at: string }) => ({
            id: blog.id,
            platform: blog.platform as 'tistory' | 'blogger' | 'wordpress',
            blogName: blog.blog_name,
            blogUrl: blog.blog_url,
            connectedAt: blog.created_at,
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
    }
  };

  // 블로그 플랫폼 정보
  const blogPlatforms = [
    {
      id: 'blogger',
      name: '구글 블로거',
      description: 'Google 계정으로 연결',
      icon: '🔵',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      id: 'wordpress',
      name: '워드프레스',
      description: 'WordPress Application Password로 연결',
      icon: '⚙️',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    },
  ];

  // 구글 블로거 연결 (OAuth)
  const handleConnectBlogger = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/blog/blogger/oauth');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '구글 블로거 연결에 실패했습니다.');
      }

      // OAuth URL로 리다이렉트
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '구글 블로거 연결에 실패했습니다.');
      setLoading(false);
    }
  };

  // 워드프레스 연결
  const handleConnectWordPress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const form = e.target as HTMLFormElement;
    const blogUrl = form.blogUrl.value;
    const username = form.username.value;
    const applicationPassword = form.applicationPassword.value;

    try {
      const response = await fetch('/api/blog/wordpress/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogUrl, username, applicationPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '워드프레스 연결에 실패했습니다.');
      }

      setSuccess('워드프레스 블로그가 연결되었습니다.');
      setConnectedBlogs([
        ...connectedBlogs,
        {
          id: data.blog?.id || Date.now().toString(),
          platform: 'wordpress',
          blogName: data.blogName || '워드프레스 블로그',
          blogUrl: blogUrl,
          connectedAt: new Date().toISOString(),
        },
      ]);
      setSelectedPlatform(null);
      form.reset();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '워드프레스 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 블로그 연결 해제
  const handleDisconnectBlog = async (blogId: string) => {
    if (!confirm('블로그 연결을 해제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/blog/${blogId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('블로그 연결 해제에 실패했습니다.');
      }

      setConnectedBlogs(connectedBlogs.filter((blog) => blog.id !== blogId));
      setSuccess('블로그 연결이 해제되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '블로그 연결 해제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (connectedBlogs.length === 0) {
      setError('최소 1개 이상의 블로그를 연결해주세요.');
      return;
    }
    window.location.href = '/onboarding/api-key';
  };

  return (
    <div className="p-8">
      {/* OAuth 결과 처리 (Suspense로 감싸기) */}
      <Suspense fallback={null}>
        <OAuthResultHandler onSuccess={handleOAuthSuccess} onError={handleOAuthError} />
      </Suspense>

      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">블로그 연결</h2>
          <p className="text-gray-600">
            AI가 생성한 콘텐츠를 발행할 블로그를 연결해주세요. 하나 이상의 블로그를 연결할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {/* 성공 메시지 */}
        {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">{success}</div>}

        {/* 플랫폼 선택 */}
        {!selectedPlatform ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {blogPlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id as BlogPlatform)}
                className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${platform.color} hover:shadow-md text-left`}
              >
                <div className="text-4xl mb-4">{platform.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-600">{platform.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-8">
            {/* 구글 블로거 연결 (OAuth) */}
            {selectedPlatform === 'blogger' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
                <div className="text-6xl mb-4 text-center">🔵</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">구글 블로거 연결</h3>
                <p className="text-gray-600 mb-6 text-center">
                  Google 계정으로 로그인하여 블로거에 글을 발행할 수 있는 권한을 부여해주세요.
                </p>

                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">연결 과정</h4>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Google 계정으로 로그인</li>
                      <li>Blogger 접근 권한 허용</li>
                      <li>자동으로 블로그 정보 연동</li>
                    </ol>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleConnectBlogger}
                      disabled={loading}
                      size="lg"
                      className="min-w-[200px] bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? '연결 중...' : 'Google 계정으로 연결'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedPlatform(null)}
                      disabled={loading}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 워드프레스 연결 폼 */}
            {selectedPlatform === 'wordpress' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-8">
                <div className="text-6xl mb-4 text-center">⚙️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">워드프레스 블로그 연결</h3>
                <p className="text-gray-600 mb-6 text-center">
                  워드프레스 블로그 URL과 Application Password를 입력해주세요.
                </p>

                <form onSubmit={handleConnectWordPress} className="space-y-6">
                  <div>
                    <label htmlFor="blogUrl" className="block text-sm font-medium mb-2">
                      블로그 URL
                    </label>
                    <Input
                      id="blogUrl"
                      type="url"
                      name="blogUrl"
                      placeholder="https://your-blog.wordpress.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-2">
                      사용자명
                    </label>
                    <Input id="username" type="text" name="username" placeholder="username" required />
                  </div>

                  <div>
                    <label htmlFor="applicationPassword" className="block text-sm font-medium mb-2">
                      Application Password
                    </label>
                    <Input
                      id="applicationPassword"
                      type="password"
                      name="applicationPassword"
                      placeholder="WordPress Application Password"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      WordPress 대시보드 &gt; 사용자 &gt; 프로필에서 Application Password를 생성할 수 있습니다.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading} size="lg" className="min-w-[200px]">
                      {loading ? '연결 중...' : '연결하기'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedPlatform(null)}
                      disabled={loading}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 연결된 블로그 목록 */}
        {connectedBlogs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">연결된 블로그</h3>
            <div className="space-y-3">
              {connectedBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {blog.platform === 'blogger' && '🔵'}
                      {blog.platform === 'wordpress' && '⚙️'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{blog.blogName}</h4>
                      <p className="text-sm text-gray-500">
                        {blog.platform === 'blogger' && '구글 블로거'}
                        {blog.platform === 'wordpress' && '워드프레스'}
                        {blog.blogUrl && ` · ${blog.blogUrl}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectBlog(blog.id)}
                    disabled={loading}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    연결 해제
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 다음 버튼 */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            onClick={handleNext}
            size="lg"
            disabled={loading || connectedBlogs.length === 0}
            className="min-w-[200px]"
          >
            다음: API 키 등록
          </Button>
        </div>
      </div>
    </div>
  );
}
