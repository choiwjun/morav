import {
  PublishParams,
  PublishResult,
  BlogCredentials,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  calculateBackoffDelay,
  isRetryableError,
} from './types';

const TISTORY_API_URL = 'https://www.tistory.com/apis';

interface TistoryPostResponse {
  tistory: {
    status: string;
    postId?: string;
    url?: string;
    error_message?: string;
  };
}

/**
 * 티스토리 블로그에 포스트 발행
 */
export async function publishToTistory(
  params: PublishParams,
  credentials: BlogCredentials,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<PublishResult> {
  const { title, content, category, tags, visibility = 'public' } = params;
  const { accessToken, blogUrl } = credentials;

  if (!accessToken) {
    return {
      success: false,
      error: '티스토리 액세스 토큰이 없습니다.',
      platform: 'tistory',
    };
  }

  if (!blogUrl) {
    return {
      success: false,
      error: '블로그 URL이 없습니다.',
      platform: 'tistory',
    };
  }

  // 블로그 이름 추출 (예: myblog.tistory.com -> myblog)
  const blogName = extractBlogName(blogUrl);

  let lastError: string = '';
  let attempt = 0;

  while (attempt <= retryConfig.maxRetries) {
    try {
      const formData = new URLSearchParams();
      formData.append('access_token', accessToken);
      formData.append('output', 'json');
      formData.append('blogName', blogName);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('visibility', visibilityToTistory(visibility));

      if (category) {
        formData.append('category', category);
      }

      if (tags && tags.length > 0) {
        formData.append('tag', tags.join(','));
      }

      const response = await fetch(`${TISTORY_API_URL}/post/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        if (isRetryableError(response.status) && attempt < retryConfig.maxRetries) {
          const delay = calculateBackoffDelay(attempt, retryConfig);
          await sleep(delay);
          attempt++;
          lastError = `HTTP ${response.status}`;
          continue;
        }

        return {
          success: false,
          error: `티스토리 API 오류: ${response.status}`,
          platform: 'tistory',
        };
      }

      const data: TistoryPostResponse = await response.json();

      if (data.tistory.status !== '200') {
        // 재시도 가능한 에러인 경우
        if (attempt < retryConfig.maxRetries) {
          const delay = calculateBackoffDelay(attempt, retryConfig);
          await sleep(delay);
          attempt++;
          lastError = data.tistory.error_message || 'Unknown error';
          continue;
        }

        return {
          success: false,
          error: data.tistory.error_message || '포스트 발행에 실패했습니다.',
          platform: 'tistory',
        };
      }

      return {
        success: true,
        postId: data.tistory.postId,
        postUrl: data.tistory.url || `https://${blogName}.tistory.com/${data.tistory.postId}`,
        platform: 'tistory',
        publishedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoffDelay(attempt, retryConfig);
        await sleep(delay);
        attempt++;
        lastError = error instanceof Error ? error.message : 'Unknown error';
        continue;
      }

      console.error('Tistory publish error:', error);
      return {
        success: false,
        error: lastError || '포스트 발행 중 오류가 발생했습니다.',
        platform: 'tistory',
      };
    }
  }

  return {
    success: false,
    error: `최대 재시도 횟수(${retryConfig.maxRetries}회) 초과: ${lastError}`,
    platform: 'tistory',
  };
}

/**
 * 티스토리 카테고리 목록 조회
 */
export async function getTistoryCategories(
  credentials: BlogCredentials
): Promise<{ success: boolean; categories?: Array<{ id: string; name: string }>; error?: string }> {
  const { accessToken, blogUrl } = credentials;

  if (!accessToken || !blogUrl) {
    return { success: false, error: '인증 정보가 없습니다.' };
  }

  const blogName = extractBlogName(blogUrl);

  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      output: 'json',
      blogName,
    });

    const response = await fetch(`${TISTORY_API_URL}/category/list?${params.toString()}`);

    if (!response.ok) {
      return { success: false, error: `API 오류: ${response.status}` };
    }

    const data = await response.json();

    if (data.tistory.status !== '200') {
      return { success: false, error: data.tistory.error_message || '카테고리 조회 실패' };
    }

    const categories = (data.tistory.item?.categories || []).map(
      (cat: { id: string; name: string }) => ({
        id: cat.id,
        name: cat.name,
      })
    );

    return { success: true, categories };
  } catch (error) {
    console.error('Get Tistory categories error:', error);
    return { success: false, error: '카테고리 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 블로그 URL에서 블로그 이름 추출
 */
function extractBlogName(blogUrl: string): string {
  // https://myblog.tistory.com 또는 myblog.tistory.com 형식 처리
  const match = blogUrl.match(/(?:https?:\/\/)?([^.]+)\.tistory\.com/);
  return match ? match[1] : blogUrl;
}

/**
 * visibility를 티스토리 API 형식으로 변환
 */
function visibilityToTistory(visibility: 'public' | 'private' | 'draft'): string {
  switch (visibility) {
    case 'public':
      return '3'; // 발행
    case 'private':
      return '1'; // 비공개
    case 'draft':
      return '0'; // 비공개(임시저장)
    default:
      return '3';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
