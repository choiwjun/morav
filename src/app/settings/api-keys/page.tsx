'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Shield, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  provider: 'openai' | 'claude' | 'gemini' | 'grok';
  providerName: string;
  maskedKey: string;
  isValid: boolean;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiKeysResponse {
  success: boolean;
  apiKeys?: ApiKey[];
  count?: number;
  error?: string;
}

const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI',
    icon: '🤖',
    color: 'bg-green-50',
  },
  claude: {
    name: 'Claude',
    icon: '🧠',
    color: 'bg-orange-50',
  },
  gemini: {
    name: 'Google Gemini',
    icon: '💎',
    color: 'bg-blue-50',
  },
  grok: {
    name: 'Grok',
    icon: '🚀',
    color: 'bg-purple-50',
  },
};

/**
 * 날짜 포맷팅 (예: "2026-01-05")
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 상대 시간 포맷팅 (예: "3일 전")
 */
function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}개월 전`;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [revalidatingId, setRevalidatingId] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys');
      const data: ApiKeysResponse = await response.json();

      if (!data.success || !data.apiKeys) {
        toast.error(data.error || 'API 키 목록을 불러올 수 없습니다.');
        return;
      }

      setApiKeys(data.apiKeys);
    } catch (error) {
      console.error('Load API keys error:', error);
      toast.error('API 키 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (keyId: string, providerName: string) => {
    if (!confirm(`"${providerName}" API 키를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || 'API 키 삭제에 실패했습니다.');
        return;
      }

      toast.success('API 키가 삭제되었습니다.');
      loadApiKeys();
    } catch (error) {
      console.error('Delete API key error:', error);
      toast.error('API 키 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleRevalidate = async (keyId: string) => {
    setRevalidatingId(keyId);

    try {
      const response = await fetch(`/api/api-keys/${keyId}/revalidate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || 'API 키 재검증에 실패했습니다.');
        return;
      }

      if (data.isValid) {
        toast.success(data.message || 'API 키가 유효합니다.');
      } else {
        toast.error(data.message || 'API 키가 유효하지 않습니다.');
      }

      loadApiKeys();
    } catch (error) {
      console.error('Revalidate API key error:', error);
      toast.error('API 키 재검증 중 오류가 발생했습니다.');
    } finally {
      setRevalidatingId(null);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">AI API 키 관리</h1>
          <p className="text-gray-500 mt-1">등록된 API 키: {apiKeys.length}개</p>
        </div>

        <Button variant="default" onClick={() => router.push('/onboarding/api-key')}>
          <Plus size={16} className="mr-2" />
          API 키 추가
        </Button>
      </div>

      {/* API 키 리스트 */}
      {apiKeys.length > 0 ? (
        <div className="space-y-4 mb-6">
          {apiKeys.map((key) => {
            const providerInfo = PROVIDER_INFO[key.provider];

            return (
              <Card key={key.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Provider 아이콘 */}
                    <div className={`p-3 ${providerInfo.color} rounded-lg`}>
                      <span className="text-2xl">{providerInfo.icon}</span>
                    </div>

                    {/* API 키 정보 */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {key.providerName}
                      </h3>

                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                          {key.maskedKey}
                        </code>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">
                        등록일: {formatDate(key.createdAt)}
                      </p>

                      {/* 검증 상태 */}
                      <div className="flex items-center gap-2">
                        {key.isValid ? (
                          <>
                            <CheckCircle size={14} className="text-green-500" />
                            <span className="text-xs text-green-600">유효</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="text-red-500" />
                            <span className="text-xs text-red-600">유효하지 않음</span>
                          </>
                        )}
                        {key.lastVerifiedAt && (
                          <span className="text-xs text-gray-500">
                            · 마지막 검증: {formatTimeAgo(key.lastVerifiedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevalidate(key.id)}
                      disabled={revalidatingId === key.id}
                    >
                      <RefreshCw
                        size={14}
                        className={`mr-1 ${revalidatingId === key.id ? 'animate-spin' : ''}`}
                      />
                      재검증
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(key.id, key.providerName)}
                    >
                      <Trash2 size={14} className="mr-1" />
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* 빈 상태 */
        <Card className="p-12 text-center mb-6">
          <div className="text-gray-400 mb-4">
            <Shield size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">
            등록된 API 키가 없습니다
          </h3>
          <p className="text-gray-500 mb-6">
            AI API 키를 등록하여 콘텐츠 생성을 시작하세요
          </p>
          <Button variant="default" onClick={() => router.push('/onboarding/api-key')}>
            <Plus size={16} className="mr-2" />
            API 키 추가하기
          </Button>
        </Card>
      )}

      {/* 보안 안내 */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Shield className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">보안 안내</h4>
            <p className="text-sm text-blue-700">
              API 키는 AES-256으로 암호화되어 안전하게 저장됩니다. 모라브는 귀하의
              API 키를 절대 다른 용도로 사용하지 않습니다.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}