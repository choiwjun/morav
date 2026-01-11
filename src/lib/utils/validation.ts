/**
 * 입력 검증 유틸리티
 */

// 최대 길이 상수
export const MAX_LENGTHS = {
  URL: 2048,
  API_KEY: 512,
  BLOG_NAME: 255,
  USERNAME: 255,
  PASSWORD: 255,
} as const;

/**
 * URL 형식 검증
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.length > MAX_LENGTHS.URL) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * API 키 길이 검증
 */
export function isValidApiKeyLength(apiKey: string): boolean {
  return apiKey.length > 0 && apiKey.length <= MAX_LENGTHS.API_KEY;
}

/**
 * 블로그 이름 길이 검증
 */
export function isValidBlogName(name: string): boolean {
  return name.length > 0 && name.length <= MAX_LENGTHS.BLOG_NAME;
}

/**
 * 문자열 길이 검증
 */
export function isWithinMaxLength(str: string, maxLength: number): boolean {
  return str.length <= maxLength;
}

/**
 * 빈 문자열 또는 공백만 있는지 확인
 */
export function isEmptyOrWhitespace(str: string): boolean {
  return !str || str.trim() === '';
}

/**
 * UUID 형식 검증
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
