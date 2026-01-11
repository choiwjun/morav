/**
 * 타임아웃이 있는 fetch 유틸리티
 * 외부 API 호출 시 무한 대기를 방지합니다.
 */

const DEFAULT_TIMEOUT = 10000; // 10초

interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`요청 시간이 초과되었습니다. (${timeout}ms)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * API 키 검증용 짧은 타임아웃 fetch
 */
export async function fetchForValidation(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  return fetchWithTimeout(url, { ...options, timeout: options.timeout || 15000 });
}
