'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type APIProvider = 'openai' | 'claude' | 'gemini' | 'grok' | null;

interface RegisteredAPIKey {
  id: string;
  provider: 'openai' | 'claude' | 'gemini' | 'grok';
  maskedKey: string;
  verified: boolean;
}

export default function APIKeyPage() {
  const [selectedProvider, setSelectedProvider] = useState<APIProvider>(null);
  const [registeredKeys, setRegisteredKeys] = useState<RegisteredAPIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // API 제공자 정보
  const apiProviders = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5 Turbo',
      icon: '🤖',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      keyPlaceholder: 'sk-...',
    },
    {
      id: 'claude',
      name: 'Claude',
      description: 'Claude 3 Opus, Claude 3 Sonnet',
      icon: '🧠',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      keyPlaceholder: 'sk-ant-...',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Gemini Pro, Gemini Flash',
      icon: '💎',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      keyPlaceholder: 'AIza...',
    },
    {
      id: 'grok',
      name: 'Grok',
      description: 'Grok-2, Grok-1',
      icon: '🚀',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      keyPlaceholder: 'xai-...',
    },
  ];

  // API 키 등록
  const handleRegisterKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = e.target as HTMLFormElement;
      const apiKey = formData.apiKey.value;

      // TODO: API 연동 (3.3.6, 3.3.9, 3.3.10, 3.3.11 태스크 완료 후)
      const response = await fetch('/api/api-key/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API 키 검증에 실패했습니다.');
      }

      setSuccess(`${apiProviders.find((p) => p.id === selectedProvider)?.name} API 키가 등록되었습니다.`);
      setRegisteredKeys([
        ...registeredKeys,
        {
          id: Date.now().toString(),
          provider: selectedProvider,
          maskedKey: apiKey.substring(0, 8) + '...',
          verified: data.verified,
        },
      ]);
      setSelectedProvider(null);

      // 폼 초기화
      formData.reset();

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API 키 등록에 실패했습니다.';
      setError(errorMessage);

      // 유효하지 않은 API 키 에러 표시 (3.3.8 태스크)
      if (
errorMessage.includes('유효하지 않습니다') ||
        errorMessage.includes('Invalid') ||
        errorMessage.includes('invalid')
      ) {
        setError('유효하지 않은 API 키입니다. API 키를 다시 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // API 키 삭제
  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('API 키를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/api-key/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('API 키 삭제에 실패했습니다.');
      }

      setRegisteredKeys(registeredKeys.filter((key) => key.id !== keyId));
      setSuccess('API 키가 삭제되었습니다.');
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API 키 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (registeredKeys.length === 0) {
      setError('최소 1개 이상의 API 키를 등록해주세요.');
      return;
    }
    window.location.href = '/onboarding/category';
  };

  const currentProvider = apiProviders.find((p) => p.id === selectedProvider);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            AI API 키 등록
          </h2>
          <p className="text-gray-600">
            AI가 콘텐츠를 생성할 때 사용할 API 키를 등록해주세요.
            여러 제공자의 API 키를 등록할 수 있습니다.
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

        {/* 제공자 선택 */}
        {!selectedProvider ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {apiProviders.map((provider) => {
              const isAlreadyRegistered = registeredKeys.some(
                (key) => key.provider === provider.id
              );

              return (
                <button
                  key={provider.id}
                  onClick={() => !isAlreadyRegistered && setSelectedProvider(provider.id as APIProvider)}
                  disabled={isAlreadyRegistered}
                  className={`
                    p-6 rounded-xl border-2 transition-all
                    ${isAlreadyRegistered 
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' 
                      : `cursor-pointer ${provider.color} hover:shadow-md`
                    }
                  `}
                >
                  {/* 아이콘 */}
                  <div className="text-4xl mb-4">{provider.icon}</div>
                  
                  {/* 제공자 이름 */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {provider.name}
                  </h3>
                  
                  {/* 설명 */}
                  <p className="text-sm text-gray-600 mb-4">
                    {provider.description}
                  </p>

                  {/* 등록 상태 */}
                  {isAlreadyRegistered && (
                    <div className="flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      등록됨
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-8">
            {/* 선택된 제공자 API 키 등록 폼 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="text-6xl mb-4 text-center">{currentProvider?.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                {currentProvider?.name} API 키 등록
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                {currentProvider?.name} API 키를 입력하여 등록합니다.
                API 키는 안전하게 암호화되어 저장됩니다.
              </p>

              <form onSubmit={handleRegisterKey} className="space-y-6">
                {/* API 키 입력 */}
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                    API 키
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    name="apiKey"
                    placeholder={currentProvider?.keyPlaceholder}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    API 키는{' '}
                    <a
                      href="#"
                      className="text-blue-500 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: 제공자별 가이드 링크로 연결
                        alert('API 키 발급 가이드가 열립니다.');
                      }}
                    >
                      여기서
                    </a>
                    {' '}발급받을 수 있습니다.
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
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        검증 중...
                      </span>
                    ) : (
                      '등록'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedProvider(null)}
                    disabled={loading}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 등록된 API 키 목록 */}
        {registeredKeys.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              등록된 API 키
            </h3>
            <div className="space-y-3">
              {registeredKeys.map((key) => {
                const providerInfo = apiProviders.find((p) => p.id === key.provider);
                return (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {/* 제공자 아이콘 */}
                      <div className="text-2xl">{providerInfo?.icon}</div>

                      {/* API 키 정보 */}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {providerInfo?.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">
                            {key.maskedKey}
                          </p>
                          {key.verified && (
                            <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              검증됨
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                      disabled={loading}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      삭제
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 보안 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            보안 안내
          </h4>
          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
            <li>API 키는 AES-256 암호화로 저장됩니다.</li>
            <li>암호화된 키는 모라브 팀조차 볼 수 없습니다.</li>
            <li>API 키는 제공자(AI 회사)에서만 발급 가능합니다.</li>
            <li>API 키를 타인과 공유하지 마세요.</li>
            <li>의심스러운 활동이 감지되면 언제든 키를 삭제할 수 있습니다.</li>
          </ul>
        </div>

        {/* 다음 버튼 */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            onClick={handleNext}
            size="lg"
            disabled={loading || registeredKeys.length === 0}
            className="min-w-[200px]"
          >
            다음: 카테고리 선택
          </Button>
        </div>
      </div>
    </div>
  );
}
