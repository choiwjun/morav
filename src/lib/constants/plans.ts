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
