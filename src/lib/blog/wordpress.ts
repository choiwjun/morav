import {
  PublishParams,
  PublishResult,
  BlogCredentials,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  calculateBackoffDelay,
  isRetryableError,
} from './types';

interface WordPressPostResponse {
  id: number;
  link: string;
  date: string;
  status: string;
  code?: string;
  message?: string;
}

/**
 * 워드프레스 블로그에 포스트 발행
 */
export async function publishToWordPress(
  params: PublishParams,
  credentials: BlogCredentials,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<PublishResult> {
  const { title, content, category, tags, visibility = 'public' } = params;
  const { accessToken, blogUrl, username } = credentials;

  if (!accessToken || !username) {
    return {
      success: false,
      error: '워드프레스 인증 정보가 없습니다.',
      platform: 'wordpress',
    };
  }

  if (!blogUrl) {
    return {
      success: false,
      error: '블로그 URL이 없습니다.',
      platform: 'wordpress',
    };
  }

  const apiUrl = normalizeWordPressUrl(blogUrl);
  const authHeader = createBasicAuthHeader(username, accessToken);

  let lastError: string = '';
  let attempt = 0;

  while (attempt <= retryConfig.maxRetries) {
    try {
      const postData: {
        title: string;
        content: string;
        status: string;
        categories?: number[];
        tags?: number[];
      } = {
        title,
        content: convertMarkdownToHtml(content),
        status: visibilityToWordPress(visibility),
      };

      // 카테고리 ID가 있으면 추가 (숫자인 경우)
      if (category && !isNaN(Number(category))) {
        postData.categories = [Number(category)];
      }

      const response = await fetch(`${apiUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        if (isRetryableError(response.status) && attempt < retryConfig.maxRetries) {
          const delay = calculateBackoffDelay(attempt, retryConfig);
          await sleep(delay);
          attempt++;
          lastError = `HTTP ${response.status}`;
          continue;
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `워드프레스 API 오류: ${response.status}`,
          platform: 'wordpress',
        };
      }

      const data: WordPressPostResponse = await response.json();

      if (data.code) {
        // 재시도 가능한 에러인 경우
        if (attempt < retryConfig.maxRetries) {
          const delay = calculateBackoffDelay(attempt, retryConfig);
          await sleep(delay);
          attempt++;
          lastError = data.message || 'Unknown error';
          continue;
        }

        return {
          success: false,
          error: data.message || '포스트 발행에 실패했습니다.',
          platform: 'wordpress',
        };
      }

      // 태그 추가 (포스트 생성 후 별도 처리)
      if (tags && tags.length > 0) {
        await addTagsToPost(data.id, tags, apiUrl, authHeader);
      }

      return {
        success: true,
        postId: String(data.id),
        postUrl: data.link,
        platform: 'wordpress',
        publishedAt: data.date || new Date().toISOString(),
      };
    } catch (error) {
      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoffDelay(attempt, retryConfig);
        await sleep(delay);
        attempt++;
        lastError = error instanceof Error ? error.message : 'Unknown error';
        continue;
      }

      console.error('WordPress publish error:', error);
      return {
        success: false,
        error: lastError || '포스트 발행 중 오류가 발생했습니다.',
        platform: 'wordpress',
      };
    }
  }

  return {
    success: false,
    error: `최대 재시도 횟수(${retryConfig.maxRetries}회) 초과: ${lastError}`,
    platform: 'wordpress',
  };
}

/**
 * 워드프레스 카테고리 목록 조회
 */
export async function getWordPressCategories(
  credentials: BlogCredentials
): Promise<{ success: boolean; categories?: Array<{ id: number; name: string }>; error?: string }> {
  const { accessToken, blogUrl, username } = credentials;

  if (!accessToken || !username || !blogUrl) {
    return { success: false, error: '인증 정보가 없습니다.' };
  }

  const apiUrl = normalizeWordPressUrl(blogUrl);
  const authHeader = createBasicAuthHeader(username, accessToken);

  try {
    const response = await fetch(`${apiUrl}/wp-json/wp/v2/categories?per_page=100`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      return { success: false, error: `API 오류: ${response.status}` };
    }

    const data = await response.json();

    const categories = data.map((cat: { id: number; name: string }) => ({
      id: cat.id,
      name: cat.name,
    }));

    return { success: true, categories };
  } catch (error) {
    console.error('Get WordPress categories error:', error);
    return { success: false, error: '카테고리 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 워드프레스 포스트 업데이트
 */
export async function updateWordPressPost(
  postId: string,
  params: PublishParams,
  credentials: BlogCredentials
): Promise<PublishResult> {
  const { title, content, visibility = 'public' } = params;
  const { accessToken, blogUrl, username } = credentials;

  if (!accessToken || !username || !blogUrl) {
    return {
      success: false,
      error: '인증 정보가 없습니다.',
      platform: 'wordpress',
    };
  }

  const apiUrl = normalizeWordPressUrl(blogUrl);
  const authHeader = createBasicAuthHeader(username, accessToken);

  try {
    const response = await fetch(`${apiUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        title,
        content: convertMarkdownToHtml(content),
        status: visibilityToWordPress(visibility),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `API 오류: ${response.status}`,
        platform: 'wordpress',
      };
    }

    const data: WordPressPostResponse = await response.json();

    return {
      success: true,
      postId: String(data.id),
      postUrl: data.link,
      platform: 'wordpress',
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Update WordPress post error:', error);
    return {
      success: false,
      error: '포스트 업데이트 중 오류가 발생했습니다.',
      platform: 'wordpress',
    };
  }
}

/**
 * 포스트에 태그 추가
 */
async function addTagsToPost(
  postId: number,
  tags: string[],
  apiUrl: string,
  authHeader: string
): Promise<void> {
  try {
    // 태그 생성 또는 조회
    const tagIds: number[] = [];

    for (const tagName of tags) {
      // 기존 태그 검색
      const searchResponse = await fetch(
        `${apiUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`,
        { headers: { Authorization: authHeader } }
      );

      if (searchResponse.ok) {
        const existingTags = await searchResponse.json();
        const exactMatch = existingTags.find(
          (t: { name: string }) => t.name.toLowerCase() === tagName.toLowerCase()
        );

        if (exactMatch) {
          tagIds.push(exactMatch.id);
          continue;
        }
      }

      // 새 태그 생성
      const createResponse = await fetch(`${apiUrl}/wp-json/wp/v2/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ name: tagName }),
      });

      if (createResponse.ok) {
        const newTag = await createResponse.json();
        tagIds.push(newTag.id);
      }
    }

    // 포스트에 태그 연결
    if (tagIds.length > 0) {
      await fetch(`${apiUrl}/wp-json/wp/v2/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ tags: tagIds }),
      });
    }
  } catch (error) {
    console.error('Add tags error:', error);
    // 태그 추가 실패는 무시 (포스트 발행은 성공)
  }
}

/**
 * 워드프레스 URL 정규화
 */
function normalizeWordPressUrl(blogUrl: string): string {
  let url = blogUrl.trim();

  // 프로토콜 추가
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // 끝의 슬래시 제거
  url = url.replace(/\/+$/, '');

  return url;
}

/**
 * Basic Auth 헤더 생성
 */
function createBasicAuthHeader(username: string, applicationPassword: string): string {
  const credentials = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * visibility를 워드프레스 API 형식으로 변환
 */
function visibilityToWordPress(visibility: 'public' | 'private' | 'draft'): string {
  switch (visibility) {
    case 'public':
      return 'publish';
    case 'private':
      return 'private';
    case 'draft':
      return 'draft';
    default:
      return 'publish';
  }
}

/**
 * 마크다운을 HTML로 간단 변환
 */
function convertMarkdownToHtml(markdown: string): string {
  const converted = markdown
    // 헤더
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 굵은 글씨
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 기울임
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 링크
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // 줄바꿈
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  // 단락으로 감싸기
  return `<p>${converted}</p>`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
