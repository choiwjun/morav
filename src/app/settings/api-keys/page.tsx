'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, CheckCircle, XCircle, Trash2, RefreshCw, Key, Clock } from 'lucide-react';
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
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-700',
  },
  claude: {
    name: 'Claude',
    icon: '🧠',
    color: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700',
  },
  gemini: {
    name: 'Google Gemini',
    icon: '💎',
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
  },
  grok: {
    name: 'Grok',
    icon: '🚀',
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700',
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
      <div className="space-y-6">
        <Card className="p-6 border-[#cdd6ea]">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-28 bg-gray-200 rounded"></div>
              <div className="h-28 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const validKeys = apiKeys.filter((k) => k.isValid).length;
  const invalidKeys = apiKeys.filter((k) => !k.isValid).length;

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
              <Key className="w-5 h-5 text-[#4562a1]" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">등록된 API 키</p>
              <p className="text-2xl font-bold text-[#0c111d]">{apiKeys.length}개</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">유효한 키</p>
              <p className="text-2xl font-bold text-[#0c111d]">{validKeys}개</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">유효하지 않은 키</p>
              <p className="text-2xl font-bold text-[#0c111d]">{invalidKeys}개</p>
            </div>
          </div>
        </Card>
      </div>

      {/* API 키 목록 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-[#4562a1]" />
            <div>
              <h2 className="text-lg font-semibold text-[#0c111d]">AI API 키 관리</h2>
              <p className="text-sm text-[#4562a1]">콘텐츠 생성에 사용될 AI API 키를 관리합니다</p>
            </div>
          </div>

          <Button
            onClick={() => router.push('/onboarding/api-key')}
            className="bg-[#4562a1] hover:bg-[#3a5289]"
          >
            <Plus size={16} className="mr-2" />
            API 키 추가
          </Button>
        </div>

        <div className="p-6">
          {apiKeys.length > 0 ? (
            <div className="space-y-4">
              {apiKeys.map((key) => {
                const providerInfo = PROVIDER_INFO[key.provider];

                return (
                  <div
                    key={key.id}
                    className={`p-4 rounded-xl border ${providerInfo.color} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Provider 아이콘 */}
                        <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">{providerInfo.icon}</span>
                        </div>

                        {/* API 키 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${providerInfo.textColor} bg-white border`}>
                              {providerInfo.name}
                            </Badge>
                            <Badge
                              variant={key.isValid ? 'default' : 'destructive'}
                              className={
                                key.isValid
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-red-100 text-red-700 border-red-200'
                              }
                            >
                              {key.isValid ? '유효' : '유효하지 않음'}
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-[#0c111d] mb-2">
                            {key.providerName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-[#4562a1]">
                            <code className="bg-white px-2 py-1 rounded font-mono text-xs">
                              {key.maskedKey}
                            </code>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              등록일: {formatDate(key.createdAt)}
                            </span>
                            {key.lastVerifiedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle size={14} className="text-green-500" />
                                검증: {formatTimeAgo(key.lastVerifiedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevalidate(key.id)}
                          disabled={revalidatingId === key.id}
                          className="border-[#cdd6ea] text-[#4562a1] hover:bg-white"
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
                          onClick={() => handleDelete(key.id, key.providerName)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} className="mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 빈 상태 */
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                <Key className="w-8 h-8 text-[#4562a1]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0c111d] mb-2">
                등록된 API 키가 없습니다
              </h3>
              <p className="text-[#4562a1] mb-6">
                AI API 키를 등록하여 콘텐츠 생성을 시작하세요
              </p>
              <Button
                onClick={() => router.push('/onboarding/api-key')}
                className="bg-[#4562a1] hover:bg-[#3a5289]"
              >
                <Plus size={16} className="mr-2" />
                API 키 추가하기
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 보안 안내 카드 */}
      <Card className="p-6 bg-[#f0f4ff] border-[#cdd6ea]">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-[#4562a1]" />
          </div>
          <div>
            <h4 className="font-semibold text-[#0c111d] mb-1">보안 안내</h4>
            <p className="text-sm text-[#4562a1]">
              API 키는 AES-256으로 암호화되어 안전하게 저장됩니다.
              모라브는 귀하의 API 키를 절대 다른 용도로 사용하지 않습니다.
              API 비용은 각 AI 제공업체에서 직접 청구됩니다.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
