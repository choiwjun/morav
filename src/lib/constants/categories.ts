// 카테고리 상수 정의 (3.4.1)
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
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

// 유효한 카테고리 ID 목록
export const VALID_CATEGORY_IDS = CATEGORIES.map((c) => c.id);

// 카테고리 ID로 카테고리 정보 가져오기
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

// 카테고리 ID가 유효한지 확인
export function isValidCategoryId(id: string): boolean {
  return VALID_CATEGORY_IDS.includes(id);
}

// 카테고리 ID 목록이 유효한지 확인
export function areValidCategoryIds(ids: string[]): boolean {
  return ids.every((id) => isValidCategoryId(id));
}
