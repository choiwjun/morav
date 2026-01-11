/**
 * 환경변수 검증 유틸리티
 */

interface EnvConfig {
  // OAuth - Tistory
  TISTORY_CLIENT_ID: string;
  TISTORY_CLIENT_SECRET: string;
  // OAuth - Google (Blogger)
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  // App URL
  NEXT_PUBLIC_APP_URL: string;
  // Encryption
  ENCRYPTION_SECRET_KEY: string;
}

type EnvKey = keyof EnvConfig;

const envCache: Partial<EnvConfig> = {};

/**
 * 환경변수를 가져오고 캐시합니다.
 * 필수 환경변수가 없으면 에러를 던집니다.
 */
export function getRequiredEnv(key: EnvKey): string {
  if (envCache[key]) {
    return envCache[key]!;
  }

  const value = process.env[key];
  if (!value) {
    throw new Error(`필수 환경변수 ${key}가 설정되지 않았습니다.`);
  }

  envCache[key] = value;
  return value;
}

/**
 * 환경변수를 가져옵니다. 없으면 기본값을 반환합니다.
 */
export function getEnv(key: EnvKey, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * OAuth 설정이 완료되었는지 확인합니다.
 */
export function isTistoryConfigured(): boolean {
  return !!(process.env.TISTORY_CLIENT_ID && process.env.TISTORY_CLIENT_SECRET);
}

export function isBloggerConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * 앱 URL을 가져옵니다.
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    // 개발 환경 기본값
    return 'http://localhost:3000';
  }
  // 끝에 슬래시 제거
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
