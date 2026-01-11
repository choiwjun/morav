import {
  PublishParams,
  PublishResult,
  BlogCredentials,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  calculateBackoffDelay,
  isRetryableError,
} from './types';

const BLOGGER_API_URL = 'https://www.googleapis.com/blogger/v3';

interface BloggerPostResponse {
  kind: string;
  id: string;
  url: string;
  title: string;
  published: string;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * 구글 블로거에 포스트 발행
 */
export async function publishToBlogger(
  params: PublishParams,
  credentials: BlogCredentials,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<PublishResult> {
  const { title, content, tags, visibility = 'public' } = params;
  const { accessToken, blogId } = credentials;

  if (!accessToken) {
    return {
      success: false,
      error: '블로거 액세스 토큰이 없습니다.',
      platform: 'blogger',
    };
  }

  if (!blogId) {
    return {
      success: false,
      error: '블로그 ID가 없습니다.',
      platform: 'blogger',
    };
  }

  let lastError: string = '';
  let attempt = 0;

  while (attempt <= retryConfig.maxRetries) {
    try {
      const postData: {
        kind: string;
        title: string;
        content: string;
        labels?: string[];
      } = {
        kind: 'blogger#post',
        title,
        content: convertMarkdownToHtml(content),
      };

      if (tags && tags.length > 0) {
        postData.labels = tags;
      }

      const isDraft = visibility === 'draft';
      const url = `${BLOGGER_API_URL}/blogs/${blogId}/posts${isDraft ? '?isDraft=true' : ''}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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
          error: errorData.error?.message || `블로거 API 오류: ${response.status}`,
          platform: 'blogger',
        };
      }

      const data: BloggerPostResponse = await response.json();

      if (data.error) {
        return {
          success: false,
          error: data.error.message,
          platform: 'blogger',
        };
      }

      return {
        success: true,
        postId: data.id,
        postUrl: data.url,
        platform: 'blogger',
        publishedAt: data.published || new Date().toISOString(),
      };
    } catch (error) {
      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoffDelay(attempt, retryConfig);
        await sleep(delay);
        attempt++;
        lastError = error instanceof Error ? error.message : 'Unknown error';
        continue;
      }

      console.error('Blogger publish error:', error);
      return {
        success: false,
        error: lastError || '포스트 발행 중 오류가 발생했습니다.',
        platform: 'blogger',
      };
    }
  }

  return {
    success: false,
    error: `최대 재시도 횟수(${retryConfig.maxRetries}회) 초과: ${lastError}`,
    platform: 'blogger',
  };
}

/**
 * 블로거 포스트 업데이트
 */
export async function updateBloggerPost(
  postId: string,
  params: PublishParams,
  credentials: BlogCredentials
): Promise<PublishResult> {
  const { title, content, tags } = params;
  const { accessToken, blogId } = credentials;

  if (!accessToken || !blogId) {
    return {
      success: false,
      error: '인증 정보가 없습니다.',
      platform: 'blogger',
    };
  }

  try {
    const postData: {
      kind: string;
      id: string;
      title: string;
      content: string;
      labels?: string[];
    } = {
      kind: 'blogger#post',
      id: postId,
      title,
      content: convertMarkdownToHtml(content),
    };

    if (tags && tags.length > 0) {
      postData.labels = tags;
    }

    const response = await fetch(`${BLOGGER_API_URL}/blogs/${blogId}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `API 오류: ${response.status}`,
        platform: 'blogger',
      };
    }

    const data: BloggerPostResponse = await response.json();

    return {
      success: true,
      postId: data.id,
      postUrl: data.url,
      platform: 'blogger',
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Update Blogger post error:', error);
    return {
      success: false,
      error: '포스트 업데이트 중 오류가 발생했습니다.',
      platform: 'blogger',
    };
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
