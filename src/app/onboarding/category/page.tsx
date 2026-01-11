'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 카테고리 정의 (3.4.1 태스크 상수)
const CATEGORIES = [
  {
    id: 'health',
    name: '건강/의학',
    description: '건강 관리, 의학 정보, 웰니스',
    icon: '🏥',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
  },
  {
    id: 'tech',
    name: 'IT/기술',
    description: '프로그래밍, 개발, 기술 리뷰',
    icon: '💻',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    id: 'parenting',
    name: '육아/육성',
    description: '육아 팁, 아동 교육, 가족 생활',
    icon: '👶',
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
  },
  {
    id: 'business',
    name: '비즈니스/재무',
    description: '경영 전략, 재테크, 마케팅',
    icon: '💼',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  },
  {
    id: 'education',
    name: '교육/자기계발',
    description: '공부법, 자기계발, 언어 학습',
    icon: '📚',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  },
  {
    id: 'lifestyle',
    name: '라이프스타일',
    description: '일상생활, 팁, 라이프해킹',
    icon: '🌟',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
  {
    id: 'travel',
    name: '여행/레저',
    description: '여행 가이드, 여행지 추천, 레저',
    icon: '✈️',
    color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
  },
  {
    id: 'food',
    name: '음식/레시피',
    description: '요리 레시피, 맛집 리뷰, 식당 정보',
    icon: '🍳',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  },
  {
    id: 'fashion',
    name: '패션/뷰티',
    description: '패션 트렌드, 뷰티 팁, 쇼핑 정보',
    icon: '👗',
    color: 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100',
  },
  {
    id: 'entertainment',
    name: '엔터테인먼트',
    description: '영화, 드라마, 음악, 쇼핑',
    icon: '🎬',
    color: 'bg-rose-50 border-rose-200 hover:bg-rose-100',
  },
  {
    id: 'sports',
    name: '스포츠',
    description: '운동, 스포츠, 헬스 정보',
    icon: '⚽',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
  },
  {
    id: 'automotive',
    name: '자동차',
    description: '자동차 정보, 구매 가이드, 정비',
    icon: '🚗',
    color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
  },
  {
    id: 'gaming',
    name: '게임',
    description: '게임 리뷰, e스포츠, 게임 뉴스',
    icon: '🎮',
    color: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
  },
  {
    id: 'other',
    name: '기타',
    description: '기타 주제, 잡담, 생활 팁',
    icon: '📝',
    color: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
  },
];

export default function CategoryPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 카테고리 토글
  const handleToggleCategory = (categoryId: string) => {
    setError('');

    if (selectedCategories.includes(categoryId)) {
      // 선택 해제 (최소 1개 유지)
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
      } else {
        setError('최소 1개 이상의 카테고리를 선택해주세요.');
      }
    } else {
      // 선택 (최대 5개)
      if (selectedCategories.length < 5) {
        setSelectedCategories([...selectedCategories, categoryId]);
      } else {
        setError('최대 5개까지 카테고리를 선택할 수 있습니다.');
      }
    }
  };

  // 카테고리 저장
  const handleSaveCategories = async () => {
    if (selectedCategories.length === 0) {
      setError('최소 1개 이상의 카테고리를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: API 연동 (3.4.4 태스크 완료 후)
      const response = await fetch('/api/user/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: selectedCategories,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '카테고리 저장에 실패했습니다.');
      }

      setSuccess('카테고리가 저장되었습니다.');
      
      // 1.5초 후 다음 단계로 이동
      setTimeout(() => {
        window.location.href = '/onboarding/schedule';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '카테고리 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (selectedCategories.length === 0) {
      setError('최소 1개 이상의 카테고리를 선택해주세요.');
      return;
    }
    handleSaveCategories();
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            카테고리 선택
          </h2>
          <p className="text-gray-600">
            AI가 생성할 콘텐츠의 주제를 선택해주세요.
            카테고리를 기반으로 관련 키워드를 수집합니다.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>최소 1개, 최대 5개까지 선택 가능합니다.</span>
          </div>
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

        {/* 카테고리 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);

            return (
              <button
                key={category.id}
                onClick={() => handleToggleCategory(category.id)}
                disabled={loading}
                className={`
                  p-6 rounded-xl border-2 transition-all
                  ${isSelected
                    ? `${category.color} ring-2 ring-offset-2 ring-blue-500`
                    : 'bg-white border-gray-200 hover:border-blue-300'
                  }
                  ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md'}
                `}
              >
                {/* 아이콘 */}
                <div className="text-4xl mb-3">{category.icon}</div>
                
                {/* 카테고리 이름 */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                
                {/* 설명 */}
                <p className="text-sm text-gray-600">
                  {category.description}
                </p>

                {/* 선택 표시 */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 선택된 카테고리 요약 */}
        {selectedCategories.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">
              선택된 카테고리 ({selectedCategories.length}/5)
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((categoryId) => {
                const category = CATEGORIES.find((c) => c.id === categoryId);
                return (
                  <span
                    key={categoryId}
                    className="inline-flex items-center gap-1 bg-white border border-blue-200 px-3 py-1.5 rounded-full text-sm"
                  >
                    <span>{category?.icon}</span>
                    <span className="font-medium text-gray-900">{category?.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-500">
            {selectedCategories.length}개 선택됨
          </div>
          <Button
            onClick={handleNext}
            size="lg"
            disabled={loading || selectedCategories.length === 0}
            className="min-w-[200px]"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
              </span>
            ) : (
              '다음: 스케줄 설정'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
