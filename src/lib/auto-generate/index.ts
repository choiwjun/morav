import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { generateContentWithImages, type AIProvider, type ContentGenerationParams } from '@/lib/ai';
import { checkUsageLimit } from '@/lib/subscription';

interface AutoGenerateConfig {
  userId: string;
  blogId: string;
  categories: string[];
  preferredProvider: AIProvider;
  postsPerDay: number;
}

interface AutoGenerateResult {
  success: boolean;
  generatedCount: number;
  errors: string[];
}

/**
 * 타임존 오프셋 계산 (시간 단위)
 */
function getTimezoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    'Asia/Seoul': 9,
    'Asia/Tokyo': 9,
    'Asia/Shanghai': 8,
    'UTC': 0,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'Europe/London': 0,
    'Europe/Paris': 1,
  };
  return offsets[timezone] ?? 9; // 기본값: 한국 시간
}

/**
 * 다음 발행 시간 계산 (사용자 스케줄 기반)
 */
export function calculateNextPublishTime(
  publishTime: string,
  publishDays: string[],
  timezone: string = 'Asia/Seoul'
): Date | null {
  if (!publishTime || publishDays.length === 0) {
    return null;
  }

  const [hours, minutes] = publishTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return null;
  }

  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  // 현재 UTC 시간
  const nowUtc = new Date();

  // 타임존 오프셋 (시간 단위)
  const timezoneOffsetHours = getTimezoneOffset(timezone);

  // 현재 로컬 시간 계산 (UTC + 오프셋)
  const localNow = new Date(nowUtc.getTime() + timezoneOffsetHours * 60 * 60 * 1000);

  const currentDay = localNow.getUTCDay();
  const currentHour = localNow.getUTCHours();
  const currentMinute = localNow.getUTCMinutes();

  // 발행 가능한 요일들을 숫자로 변환
  const scheduledDays = publishDays
    .map((day) => dayMap[day])
    .filter((d) => d !== undefined)
    .sort((a, b) => a - b);

  if (scheduledDays.length === 0) {
    return null;
  }

  // 오늘부터 7일 내에 가장 빠른 발행 시간 찾기
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;

    if (scheduledDays.includes(checkDay)) {
      // 오늘인 경우 시간 체크
      if (i === 0) {
        if (currentHour > hours || (currentHour === hours && currentMinute >= minutes)) {
          continue; // 오늘 발행 시간이 지났으면 다음 날로
        }
      }

      // 발행 날짜/시간 계산 (로컬 시간 기준)
      const publishDateLocal = new Date(localNow);
      publishDateLocal.setUTCDate(publishDateLocal.getUTCDate() + i);
      publishDateLocal.setUTCHours(hours, minutes, 0, 0);

      // UTC로 변환 (로컬 시간에서 타임존 오프셋을 빼면 UTC)
      const utcPublishDate = new Date(publishDateLocal.getTime() - timezoneOffsetHours * 60 * 60 * 1000);

      return utcPublishDate;
    }
  }

  return null;
}

/**
 * 사용자의 자동 생성 설정 조회
 */
export async function getAutoGenerateSettings(userId: string): Promise<{
  success: boolean;
  settings?: {
    isEnabled: boolean;
    categories: string[];
    preferredProvider: AIProvider;
    postsPerDay: number;
  };
  schedule?: {
    publishTime: string;
    publishDays: string[];
    timezone: string;
  };
  blogs?: Array<{ id: string; name: string; platform: string }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 사용자 스케줄 조회
    const { data: schedule } = await supabase
      .from('schedules')
      .select('publish_time, publish_days, timezone, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // 사용자 블로그 조회
    const { data: blogs } = await supabase
      .from('blogs')
      .select('id, blog_name, platform')
      .eq('user_id', userId)
      .eq('is_active', true);

    // 사용자 API 키 조회 (사용 가능한 AI 제공자 확인)
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('provider')
      .eq('user_id', userId)
      .eq('is_valid', true);

    const availableProviders = (apiKeys || []).map((k) => k.provider as AIProvider);
    const preferredProvider = availableProviders.includes('openai')
      ? 'openai'
      : availableProviders[0] || 'openai';

    return {
      success: true,
      settings: {
        isEnabled: !!schedule,
        categories: ['it', 'lifestyle', 'economy', 'health'], // 기본 카테고리
        preferredProvider,
        postsPerDay: 1,
      },
      schedule: schedule
        ? {
            publishTime: schedule.publish_time,
            publishDays: schedule.publish_days,
            timezone: schedule.timezone,
          }
        : undefined,
      blogs: (blogs || []).map((b) => ({
        id: b.id,
        name: b.blog_name,
        platform: b.platform,
      })),
    };
  } catch (error) {
    console.error('Get auto generate settings error:', error);
    return { success: false, error: '설정 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 미사용 인기 키워드 선택
 */
async function selectUnusedKeyword(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  categories?: string[]
): Promise<{ id: string; keyword: string; category: string } | null> {
  // 최근 24시간 내 수집된 키워드 중 미사용 키워드 선택
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 이미 사용된 키워드 ID 조회
  const { data: usedKeywords } = await supabase
    .from('posts')
    .select('keyword_id')
    .eq('user_id', userId)
    .not('keyword_id', 'is', null);

  const usedKeywordIds = (usedKeywords || [])
    .map((p) => p.keyword_id)
    .filter((id): id is string => id !== null);

  // 미사용 키워드 조회 (트렌드 점수 높은 순)
  let query = supabase
    .from('keywords')
    .select('id, keyword, category')
    .gte('collected_at', oneDayAgo)
    .order('trend_score', { ascending: false })
    .limit(1);

  // 카테고리 필터
  if (categories && categories.length > 0) {
    query = query.in('category', categories);
  }

  // 이미 사용된 키워드 제외
  if (usedKeywordIds.length > 0) {
    query = query.not('id', 'in', `(${usedKeywordIds.join(',')})`);
  }

  const { data: keywords, error } = await query;

  if (error || !keywords || keywords.length === 0) {
    // 카테고리 필터 없이 재시도
    const { data: fallbackKeywords } = await supabase
      .from('keywords')
      .select('id, keyword, category')
      .gte('collected_at', oneDayAgo)
      .order('trend_score', { ascending: false })
      .limit(10);

    if (fallbackKeywords && fallbackKeywords.length > 0) {
      // 사용되지 않은 키워드 찾기
      for (const kw of fallbackKeywords) {
        if (!usedKeywordIds.includes(kw.id)) {
          return kw;
        }
      }
    }
    return null;
  }

  return keywords[0];
}

/**
 * 사용자 API 키 조회
 */
async function getUserApiKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  provider: AIProvider
): Promise<string | null> {
  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('encrypted_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_valid', true)
    .single();

  if (!apiKey) {
    return null;
  }

  return decrypt(apiKey.encrypted_key);
}

/**
 * 단일 사용자에 대한 자동 콘텐츠 생성
 */
export async function autoGenerateForUser(config: AutoGenerateConfig): Promise<AutoGenerateResult> {
  const { userId, blogId, categories, preferredProvider, postsPerDay } = config;
  const errors: string[] = [];
  let generatedCount = 0;

  try {
    const supabase = await createClient();

    // 사용량 확인
    const usageCheck = await checkUsageLimit(userId);
    if (!usageCheck.success || !usageCheck.canPublish) {
      return {
        success: false,
        generatedCount: 0,
        errors: ['월간 발행 한도에 도달했습니다.'],
      };
    }

    // 오늘 이미 생성된 포스트 수 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    const todayPostCount = todayPosts?.length || 0;
    if (todayPostCount >= postsPerDay) {
      return {
        success: true,
        generatedCount: 0,
        errors: ['오늘 생성 한도에 도달했습니다.'],
      };
    }

    // 스케줄 조회
    const { data: schedule } = await supabase
      .from('schedules')
      .select('publish_time, publish_days, timezone')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!schedule) {
      return {
        success: false,
        generatedCount: 0,
        errors: ['발행 스케줄이 설정되지 않았습니다.'],
      };
    }

    // API 키 조회
    const apiKey = await getUserApiKey(supabase, userId, preferredProvider);
    if (!apiKey) {
      return {
        success: false,
        generatedCount: 0,
        errors: [`${preferredProvider} API 키가 설정되지 않았습니다.`],
      };
    }

    // 미사용 키워드 선택
    const keyword = await selectUnusedKeyword(supabase, userId, categories);
    if (!keyword) {
      return {
        success: false,
        generatedCount: 0,
        errors: ['사용 가능한 키워드가 없습니다.'],
      };
    }

    // 다음 발행 시간 계산
    const nextPublishTime = calculateNextPublishTime(
      schedule.publish_time,
      schedule.publish_days,
      schedule.timezone
    );

    if (!nextPublishTime) {
      return {
        success: false,
        generatedCount: 0,
        errors: ['발행 시간을 계산할 수 없습니다.'],
      };
    }

    // AI 콘텐츠 생성
    const contentParams: ContentGenerationParams = {
      keyword: keyword.keyword,
      category: keyword.category,
      tone: 'professional',
      minLength: 1500,
      language: 'ko',
    };

    const result = await generateContentWithImages(contentParams, preferredProvider, { apiKey });

    if (!result.success || !result.data) {
      errors.push(`콘텐츠 생성 실패: ${result.error}`);
      return {
        success: false,
        generatedCount: 0,
        errors,
      };
    }

    // Post 저장 (예약 발행)
    const { error: insertError } = await supabase.from('posts').insert({
      user_id: userId,
      blog_id: blogId,
      keyword_id: keyword.id,
      title: result.data.title,
      content: result.data.content,
      status: 'generated',
      scheduled_at: nextPublishTime.toISOString(),
    });

    if (insertError) {
      errors.push(`포스트 저장 실패: ${insertError.message}`);
      return {
        success: false,
        generatedCount: 0,
        errors,
      };
    }

    generatedCount++;

    return {
      success: true,
      generatedCount,
      errors,
    };
  } catch (error) {
    console.error('Auto generate for user error:', error);
    return {
      success: false,
      generatedCount,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'],
    };
  }
}

/**
 * 자동 생성이 필요한 사용자 목록 조회
 */
export async function getUsersNeedingAutoGenerate(): Promise<
  Array<{
    userId: string;
    blogId: string;
    categories: string[];
    preferredProvider: AIProvider;
    postsPerDay: number;
  }>
> {
  try {
    const supabase = await createClient();

    // 활성화된 스케줄이 있는 사용자 조회
    const { data: schedules } = await supabase
      .from('schedules')
      .select('user_id, publish_time, publish_days')
      .eq('is_active', true);

    if (!schedules || schedules.length === 0) {
      return [];
    }

    const usersToGenerate: Array<{
      userId: string;
      blogId: string;
      categories: string[];
      preferredProvider: AIProvider;
      postsPerDay: number;
    }> = [];

    for (const schedule of schedules) {
      // 활성 블로그 확인
      const { data: blogs } = await supabase
        .from('blogs')
        .select('id')
        .eq('user_id', schedule.user_id)
        .eq('is_active', true)
        .limit(1);

      if (!blogs || blogs.length === 0) {
        continue;
      }

      // API 키 확인
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('provider')
        .eq('user_id', schedule.user_id)
        .eq('is_valid', true);

      if (!apiKeys || apiKeys.length === 0) {
        continue;
      }

      const providers = apiKeys.map((k) => k.provider as AIProvider);
      const preferredProvider = providers.includes('openai')
        ? 'openai'
        : providers.includes('claude')
          ? 'claude'
          : providers[0];

      // 오늘 이미 생성된 포스트 확인
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', schedule.user_id)
        .gte('created_at', today.toISOString());

      if ((todayPosts?.length || 0) >= 1) {
        continue; // 오늘 이미 생성됨
      }

      usersToGenerate.push({
        userId: schedule.user_id,
        blogId: blogs[0].id,
        categories: ['it', 'lifestyle', 'economy', 'health'],
        preferredProvider,
        postsPerDay: 1,
      });
    }

    return usersToGenerate;
  } catch (error) {
    console.error('Get users needing auto generate error:', error);
    return [];
  }
}
