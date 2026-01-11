'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type BlogPlatform = 'tistory' | 'google' | 'wordpress' | null;

interface ConnectedBlog {
  id: string;
  platform: 'tistory' | 'google' | 'wordpress';
  blogName: string;
  connectedAt: string;
}

export default function ConnectBlogPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<BlogPlatform>(null);
  const [connectedBlogs, setConnectedBlogs] = useState<ConnectedBlog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 블로그 플랫폼 정보
  const blogPlatforms = [
    {
      id: 'tistory',
      name: '티스토리',
      description: '티스토리 블로그 OAuth로 연결',
      icon: '📝',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
    },
    {
      id: 'google',
      name: '구글 블로그',
      description: 'Google Blogger OAuth로 연결',
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

  // 티스토리 OAuth 연결
  const handleConnectTistory = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: API 연동 (3.2.3 태스크 완료 후)
      const response = await fetch('/api/blog/tistory/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '티스토리 연결에 실패했습니다.');
      }

      // OAuth URL로 리다이렉트
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '티스토리 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 구글 블로거 OAuth 연결
  const handleConnectGoogle = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: API 연동 (3.2.5 태스크 완료 후)
      const response = await fetch('/api/blog/google/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '구글 블로그 연결에 실패했습니다.');
      }

      // OAuth URL로 리다이렉트
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '구글 블로그 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 워드프레스 연결
  const handleConnectWordPress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: API 연동 (3.2.7 태스크 완료 후)
      const response = await fetch('/api/blog/wordpress/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogUrl: (e.target as HTMLFormElement).blogUrl.value,
          username: (e.target as HTMLFormElement).username.value,
          applicationPassword: (e.target as HTMLFormElement).applicationPassword.value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '워드프레스 연결에 실패했습니다.');
      }

      setSuccess('워드프레스 블로그가 연결되었습니다.');
      setConnectedBlogs([
        ...connectedBlogs,
        {
          id: Date.now().toString(),
          platform: 'wordpress',
          blogName: data.blogName,
          connectedAt: new Date().toISOString(),
        },
      ]);
      setSelectedPlatform(null);
      
      // 폼 초기화
      (e.target as HTMLFormElement).reset();

      // 3초 후 성공 메시지 숨기기
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
      // TODO: API 연동 (3.2.10 태스크 완료 후)
      const response = await fetch(`/api/blog/${blogId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('블로그 연결 해제에 실패했습니다.');
      }

      setConnectedBlogs(connectedBlogs.filter((blog) => blog.id !== blogId));
      setSuccess('블로그 연결이 해제되었습니다.');
      
      // 3초 후 성공 메시지 숨기기
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
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            블로그 연결
          </h2>
          <p className="text-gray-600">
            AI가 생성한 콘텐츠를 발행할 블로그를 연결해주세요.
            하나 이상의 블로그를 연결할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* 플랫폼 선택 */}
        {!selectedPlatform ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {blogPlatforms.map((platform) => {
              const isAlreadyConnected = connectedBlogs.some(
                (blog) => blog.platform === platform.id
              );

              return (
                <button
                  key={platform.id}
                  onClick={() => !isAlreadyConnected && setSelectedPlatform(platform.id as BlogPlatform)}
                  disabled={isAlreadyConnected}
                  className={`
                    p-6 rounded-xl border-2 transition-all
                    ${isAlreadyConnected 
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' 
                      : `cursor-pointer ${platform.color} hover:shadow-md`
                    }
                  `}
                >
                  {/* 아이콘 */}
                  <div className="text-4xl mb-4">{platform.icon}</div>
                  
                  {/* 플랫폼 이름 */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {platform.name}
                  </h3>
                  
                  {/* 설명 */}
                  <p className="text-sm text-gray-600 mb-4">
                    {platform.description}
                  </p>

                  {/* 연결 상태 */}
                  {isAlreadyConnected && (
                    <div className="flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      연결됨
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-8">
            {/* 선택된 플랫폼 연결 폼 */}
            {selectedPlatform === 'tistory' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  티스토리 블로그 연결
                </h3>
                <p className="text-gray-600 mb-6">
                  OAuth 인증을 통해 티스토리 블로그를 연결합니다.
                  계정 정보는 안전하게 저장됩니다.
                </p>
                <Button
                  onClick={handleConnectTistory}
                  disabled={loading}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {loading ? '연결 중...' : '티스토리로 연결'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPlatform(null)}
                  className="ml-4"
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
            )}

            {selectedPlatform === 'google' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">🔵</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  구글 블로그 연결
                </h3>
                <p className="text-gray-600 mb-6">
                  OAuth 인증을 통해 Google Blogger 블로그를 연결합니다.
                  계정 정보는 안전하게 저장됩니다.
                </p>
                <Button
                  onClick={handleConnectGoogle}
                  disabled={loading}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {loading ? '연결 중...' : '구글 블로그로 연결'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPlatform(null)}
                  className="ml-4"
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
            )}

            {selectedPlatform === 'wordpress' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-8">
                <div className="text-6xl mb-4 text-center">⚙️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  워드프레스 블로그 연결
                </h3>
                <p className="text-gray-600 mb-6 text-center">
                  워드프레스 블로그 URL과 Application Password를 입력하여 연결합니다.
                </p>

                <form onSubmit={handleConnectWordPress} className="space-y-6">
                  {/* 블로그 URL */}
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
                      pattern="https?://.+"
                    />
                  </div>

                  {/* 사용자명 */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-2">
                      사용자명
                    </label>
                    <Input
                      id="username"
                      type="text"
                      name="username"
                      placeholder="username"
                      required
                    />
                  </div>

                  {/* Application Password */}
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
                      Application Password는 WordPress 대시보드 &gt; 사용자 &gt; 프로필에서 생성할 수 있습니다.
                    </p>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {loading ? '연결 중...' : '연결'}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              연결된 블로그
            </h3>
            <div className="space-y-3">
              {connectedBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {/* 플랫폼 아이콘 */}
                    <div className="text-2xl">
                      {blog.platform === 'tistory' && '📝'}
                      {blog.platform === 'google' && '🔵'}
                      {blog.platform === 'wordpress' && '⚙️'}
                    </div>

                    {/* 블로그 정보 */}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {blog.blogName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {blog.platform === 'tistory' && '티스토리'}
                        {blog.platform === 'google' && '구글 블로그'}
                        {blog.platform === 'wordpress' && '워드프레스'}
                      </p>
                    </div>
                  </div>

                  {/* 연결 해제 버튼 */}
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
