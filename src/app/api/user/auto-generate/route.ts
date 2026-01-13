import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 자동 생성 설정 조회
    const { data: settings } = await supabase
      .from('auto_generate_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 스케줄 조회
    const { data: schedule } = await supabase
      .from('schedules')
      .select('publish_time, publish_days, timezone, is_active')
      .eq('user_id', user.id)
      .single();

    // 활성 블로그 조회
    const { data: blogs } = await supabase
      .from('blogs')
      .select('id, blog_name, platform')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // API 키 조회
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('provider')
      .eq('user_id', user.id)
      .eq('is_valid', true);

    return NextResponse.json({
      success: true,
      settings: settings || {
        is_enabled: false,
        preferred_provider: 'openai',
        preferred_categories: [],
        posts_per_day: 1,
        default_blog_id: null,
      },
      schedule: schedule || null,
      blogs: blogs || [],
      availableProviders: (apiKeys || []).map((k) => k.provider),
    });
  } catch (error) {
    console.error('Get auto-generate settings error:', error);
    return NextResponse.json(
      { error: '설정 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      isEnabled,
      preferredProvider,
      preferredCategories,
      postsPerDay,
      defaultBlogId,
    } = body;

    // Validation
    if (postsPerDay && (postsPerDay < 1 || postsPerDay > 10)) {
      return NextResponse.json(
        { error: '일일 생성 수는 1~10 사이여야 합니다.' },
        { status: 400 }
      );
    }

    const validProviders = ['openai', 'claude', 'gemini', 'grok'];
    if (preferredProvider && !validProviders.includes(preferredProvider)) {
      return NextResponse.json(
        { error: '유효하지 않은 AI 제공자입니다.' },
        { status: 400 }
      );
    }

    // 기존 설정 확인
    const { data: existing } = await supabase
      .from('auto_generate_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const settingsData = {
      user_id: user.id,
      is_enabled: isEnabled ?? false,
      preferred_provider: preferredProvider || 'openai',
      preferred_categories: preferredCategories || [],
      posts_per_day: postsPerDay || 1,
      default_blog_id: defaultBlogId || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update
      result = await supabase
        .from('auto_generate_settings')
        .update(settingsData)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from('auto_generate_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Save auto-generate settings error:', result.error);
      return NextResponse.json(
        { error: '설정 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: result.data,
    });
  } catch (error) {
    console.error('Save auto-generate settings error:', error);
    return NextResponse.json(
      { error: '설정 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
