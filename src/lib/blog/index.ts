import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import {
  BlogPlatform,
  PublishParams,
  PublishResult,
  BlogCredentials,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
} from './types';
import { publishToBlogger } from './blogger';
import { publishToWordPress } from './wordpress';
import { checkUsageLimit, incrementUsage } from '@/lib/subscription';
import { ensureValidToken } from './token-refresh';
import { sendPublishSuccessEmail, sendPublishFailEmail, sendUsageLimitEmail } from '@/lib/email';

// Re-export types
export type { BlogPlatform, PublishParams, PublishResult, BlogCredentials, RetryConfig } from './types';
export { DEFAULT_RETRY_CONFIG, calculateBackoffDelay } from './types';

/**
 * 블로그 자격 증명 가져오기
 */
async function getBlogCredentials(blogId: string): Promise<{
  credentials: BlogCredentials | null;
  platform: BlogPlatform | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { credentials: null, platform: null, error: '로그인이 필요합니다.' };
    }

    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id, platform, blog_url, access_token, refresh_token, external_blog_id, username')
      .eq('id', blogId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (blogError || !blog) {
      return { credentials: null, platform: null, error: '블로그를 찾을 수 없습니다.' };
    }

    // 타입 어설션 - 마이그레이션으로 추가된 컬럼
    const blogData = blog as unknown as {
      id: string;
      platform: string;
      blog_url: string;
      access_token: string;
      refresh_token: string | null;
      external_blog_id: string | null;
      username: string | null;
    };

    const platform = blogData.platform as BlogPlatform;

    // OAuth 토큰 갱신이 필요한 플랫폼 처리 (blogger)
    let accessToken: string;
    if (platform === 'blogger') {
      const tokenResult = await ensureValidToken(blogId, platform);
      if (!tokenResult.success || !tokenResult.accessToken) {
        return {
          credentials: null,
          platform: null,
          error: tokenResult.error || '토큰 갱신에 실패했습니다.',
        };
      }
      accessToken = tokenResult.accessToken;
    } else {
      // 워드프레스 등은 장기 토큰 사용
      accessToken = decrypt(blogData.access_token);
    }

    const credentials: BlogCredentials = {
      accessToken,
      refreshToken: blogData.refresh_token ? decrypt(blogData.refresh_token) : undefined,
      blogId: blogData.external_blog_id || undefined,
      blogUrl: blogData.blog_url,
      username: blogData.username || undefined,
    };

    return { credentials, platform };
  } catch (error) {
    console.error('Get blog credentials error:', error);
    return { credentials: null, platform: null, error: '블로그 정보 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 통합 블로그 발행 함수
 */
export async function publishPost(
  blogId: string,
  params: PublishParams,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<PublishResult> {
  // 자격 증명 가져오기
  const { credentials, platform, error } = await getBlogCredentials(blogId);

  if (!credentials || !platform) {
    return {
      success: false,
      error: error || '블로그 자격 증명을 가져올 수 없습니다.',
      platform: 'wordpress', // 기본값
    };
  }

  // 플랫폼별 발행
  switch (platform) {
    case 'blogger':
      return publishToBlogger(params, credentials, retryConfig);
    case 'wordpress':
      return publishToWordPress(params, credentials, retryConfig);
    default:
      return {
        success: false,
        error: `지원하지 않는 블로그 플랫폼입니다: ${platform}`,
        platform,
      };
  }
}

/**
 * 포스트 발행 및 상태 업데이트
 */
export async function publishAndUpdatePost(
  postId: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{
  success: boolean;
  postUrl?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 사용량 한도 확인
    const usageCheck = await checkUsageLimit(user.id);
    if (!usageCheck.success) {
      return { success: false, error: usageCheck.error || '사용량 확인에 실패했습니다.' };
    }
    if (!usageCheck.canPublish) {
      return { success: false, error: '월간 발행 한도에 도달했습니다. 플랜을 업그레이드해주세요.' };
    }

    // 포스트 조회
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, blog_id, title, content, status, retry_count')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) {
      return { success: false, error: '포스트를 찾을 수 없습니다.' };
    }

    // 이미 발행된 경우
    if (post.status === 'published') {
      return { success: false, error: '이미 발행된 포스트입니다.' };
    }

    // 발행 중 상태로 변경
    await supabase
      .from('posts')
      .update({ status: 'publishing' })
      .eq('id', postId);

    // 발행 시도
    const result = await publishPost(
      post.blog_id,
      {
        title: post.title,
        content: post.content,
        visibility: 'public',
      },
      retryConfig
    );

    if (result.success) {
      // 성공 - 사용량 증가
      const usageResult = await incrementUsage(user.id);
      if (!usageResult.success) {
        console.error('Failed to increment usage:', usageResult.error);
        // 사용량 증가 실패해도 발행은 성공으로 처리
      }

      // 상태 업데이트
      await supabase
        .from('posts')
        .update({
          status: 'published',
          published_url: result.postUrl,
          published_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', postId);

      // 발행 성공 이메일 발송 (비동기로 처리, 실패해도 무시)
      if (user.email && result.postUrl) {
        sendPublishSuccessEmail(user.id, user.email, post.title, result.postUrl).catch((err) =>
          console.error('Failed to send publish success email:', err)
        );
      }

      // 사용량 한도 임박 알림 (80% 이상 사용시)
      // usageCheck는 발행 전 상태이므로 +1 해서 계산
      const currentUsage = (usageCheck.usageCount || 0) + 1;
      const monthlyLimit = usageCheck.monthlyLimit || 0;
      if (monthlyLimit > 0) {
        const usageRatio = currentUsage / monthlyLimit;
        if (usageRatio >= 0.8 && user.email) {
          sendUsageLimitEmail(user.id, user.email, currentUsage, monthlyLimit).catch((err) =>
            console.error('Failed to send usage limit email:', err)
          );
        }
      }

      return { success: true, postUrl: result.postUrl };
    } else {
      // 실패 - 재시도 횟수 증가
      const newRetryCount = (post.retry_count || 0) + 1;
      const newStatus = newRetryCount >= retryConfig.maxRetries ? 'failed' : 'generated';

      await supabase
        .from('posts')
        .update({
          status: newStatus,
          retry_count: newRetryCount,
          error_message: result.error,
        })
        .eq('id', postId);

      // 최종 실패시 이메일 발송
      if (newStatus === 'failed' && user.email) {
        sendPublishFailEmail(user.id, user.email, post.title, result.error || '알 수 없는 오류').catch(
          (err) => console.error('Failed to send publish fail email:', err)
        );
      }

      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Publish and update post error:', error);
    return { success: false, error: '발행 중 오류가 발생했습니다.' };
  }
}

/**
 * 예약된 포스트 발행 (Cron job용)
 */
export async function publishScheduledPosts(): Promise<{
  success: boolean;
  published: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let published = 0;
  let failed = 0;

  try {
    const supabase = await createClient();

    // 발행 예정 시간이 지난 포스트 조회 (scheduled 또는 generated 상태)
    const now = new Date().toISOString();
    const { data: posts, error: queryError } = await supabase
      .from('posts')
      .select('id, user_id, blog_id, title, content, retry_count')
      .in('status', ['scheduled', 'generated'])
      .lte('scheduled_at', now)
      .lt('retry_count', DEFAULT_RETRY_CONFIG.maxRetries)
      .limit(10); // 한 번에 최대 10개

    if (queryError) {
      return { success: false, published: 0, failed: 0, errors: [queryError.message] };
    }

    if (!posts || posts.length === 0) {
      return { success: true, published: 0, failed: 0, errors: [] };
    }

    // 각 포스트 발행
    for (const post of posts) {
      try {
        // 사용량 한도 확인
        const usageCheck = await checkUsageLimit(post.user_id);
        if (!usageCheck.success || !usageCheck.canPublish) {
          await updatePostFailed(
            supabase,
            post.id,
            post.retry_count,
            '월간 발행 한도에 도달했습니다.'
          );
          failed++;
          errors.push(`Post ${post.id}: 월간 발행 한도 초과`);
          continue;
        }

        // 발행 중 상태로 변경
        await supabase
          .from('posts')
          .update({ status: 'publishing' })
          .eq('id', post.id);

        // 블로그 정보 조회
        const { credentials, platform, error: credError } = await getBlogCredentials(post.blog_id);

        if (!credentials || !platform) {
          await updatePostFailed(supabase, post.id, post.retry_count, credError || 'No credentials');
          failed++;
          errors.push(`Post ${post.id}: ${credError}`);
          continue;
        }

        // 발행
        let result: PublishResult;
        switch (platform) {
          case 'blogger':
            result = await publishToBlogger(
              { title: post.title, content: post.content, visibility: 'public' },
              credentials
            );
            break;
          case 'wordpress':
            result = await publishToWordPress(
              { title: post.title, content: post.content, visibility: 'public' },
              credentials
            );
            break;
          default:
            result = { success: false, error: 'Unsupported platform', platform };
        }

        if (result.success) {
          // 사용량 증가
          const usageResult = await incrementUsage(post.user_id);
          if (!usageResult.success) {
            console.error(`Failed to increment usage for user ${post.user_id}:`, usageResult.error);
          }

          await supabase
            .from('posts')
            .update({
              status: 'published',
              published_url: result.postUrl,
              published_at: new Date().toISOString(),
              error_message: null,
            })
            .eq('id', post.id);
          published++;
        } else {
          await updatePostFailed(supabase, post.id, post.retry_count, result.error || 'Unknown error');
          failed++;
          errors.push(`Post ${post.id}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await updatePostFailed(supabase, post.id, post.retry_count, errorMsg);
        failed++;
        errors.push(`Post ${post.id}: ${errorMsg}`);
      }
    }

    return { success: true, published, failed, errors };
  } catch (error) {
    console.error('Publish scheduled posts error:', error);
    return {
      success: false,
      published,
      failed,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * 포스트 실패 상태 업데이트
 */
async function updatePostFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  currentRetryCount: number,
  errorMessage: string
): Promise<void> {
  const newRetryCount = (currentRetryCount || 0) + 1;
  const newStatus = newRetryCount >= DEFAULT_RETRY_CONFIG.maxRetries ? 'failed' : 'generated';

  await supabase
    .from('posts')
    .update({
      status: newStatus,
      retry_count: newRetryCount,
      error_message: errorMessage,
    })
    .eq('id', postId);
}

/**
 * 수동 재시도 (실패한 포스트 재발행)
 */
export async function retryFailedPost(postId: string): Promise<{
  success: boolean;
  postUrl?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 포스트 조회
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) {
      return { success: false, error: '포스트를 찾을 수 없습니다.' };
    }

    // 실패한 포스트만 재시도 가능
    if (post.status !== 'failed') {
      return { success: false, error: '실패한 포스트만 재시도할 수 있습니다.' };
    }

    // 재시도 횟수 초기화 및 재발행
    await supabase
      .from('posts')
      .update({ retry_count: 0, status: 'generated' })
      .eq('id', postId);

    return publishAndUpdatePost(postId);
  } catch (error) {
    console.error('Retry failed post error:', error);
    return { success: false, error: '재시도 중 오류가 발생했습니다.' };
  }
}
