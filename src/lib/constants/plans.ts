// 플랜별 월간 한도
export const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  light: 30,
  standard: 100,
  pro: 300,
  unlimited: 999999,
};

// 플랜별 이름
export const PLAN_NAMES: Record<string, string> = {
  free: '무료',
  light: '라이트',
  standard: '스탠다드',
  pro: '프로',
  unlimited: '무제한',
};

// 플랜별 1개 블로그 가격 (원)
export const PLAN_PRICES_1_BLOG: Record<string, number> = {
  free: 0,
  light: 19000,
  standard: 39000,
  pro: 69000,
  unlimited: 99000,
};

// 플랜별 2개 블로그 가격 (원)
export const PLAN_PRICES_2_BLOG: Record<string, number> = {
  free: 0,
  light: 29000,
  standard: 59000,
  pro: 99000,
  unlimited: 149000,
};

// 플랜별 3개 블로그 가격 (원)
export const PLAN_PRICES_3_BLOG: Record<string, number> = {
  free: 0,
  light: 39000,
  standard: 79000,
  pro: 129000,
  unlimited: 199000,
};

// 플랜별 월간 발행 건수 표시
export const PLAN_POSTS_DISPLAY: Record<string, string> = {
  free: '5건',
  light: '50건',
  standard: '200건',
  pro: '500건',
  unlimited: '무제한',
};

// 플랜 정보 인터페이스
export interface PlanInfo {
  id: string;
  name: string;
  price: number; // 1개 블로그 기준 가격
  posts: string; // 발행 건수 표시
  monthlyLimit: number; // 실제 한도
  badge?: string; // 뱃지 텍스트 (예: "💎 BEST")
}

// 플랜 목록 (1개 블로그 기준)
export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: PLAN_NAMES.free,
    price: PLAN_PRICES_1_BLOG.free,
    posts: PLAN_POSTS_DISPLAY.free,
    monthlyLimit: PLAN_LIMITS.free,
  },
  {
    id: 'light',
    name: PLAN_NAMES.light,
    price: PLAN_PRICES_1_BLOG.light,
    posts: PLAN_POSTS_DISPLAY.light,
    monthlyLimit: PLAN_LIMITS.light,
    badge: '💎 BEST',
  },
  {
    id: 'standard',
    name: PLAN_NAMES.standard,
    price: PLAN_PRICES_1_BLOG.standard,
    posts: PLAN_POSTS_DISPLAY.standard,
    monthlyLimit: PLAN_LIMITS.standard,
  },
  {
    id: 'pro',
    name: PLAN_NAMES.pro,
    price: PLAN_PRICES_1_BLOG.pro,
    posts: PLAN_POSTS_DISPLAY.pro,
    monthlyLimit: PLAN_LIMITS.pro,
  },
  {
    id: 'unlimited',
    name: PLAN_NAMES.unlimited,
    price: PLAN_PRICES_1_BLOG.unlimited,
    posts: PLAN_POSTS_DISPLAY.unlimited,
    monthlyLimit: PLAN_LIMITS.unlimited,
  },
];

/**
 * 블로그 수에 따른 가격 계산
 */
export function calculatePlanPrice(
  planId: string,
  blogCount: number
): number {
  if (planId === 'free') return 0;

  if (blogCount === 1) {
    return PLAN_PRICES_1_BLOG[planId] || 0;
  } else if (blogCount === 2) {
    return PLAN_PRICES_2_BLOG[planId] || 0;
  } else if (blogCount === 3) {
    return PLAN_PRICES_3_BLOG[planId] || 0;
  }

  return PLAN_PRICES_1_BLOG[planId] || 0;
}
