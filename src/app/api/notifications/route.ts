import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface NotificationSettings {
  emailOnPublishSuccess: boolean;
  emailOnPublishFail: boolean;
  emailOnSubscriptionChange: boolean;
  emailOnUsageLimit: boolean;
  emailMarketing: boolean;
  emailNewsletter: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  emailOnPublishSuccess: true,
  emailOnPublishFail: true,
  emailOnSubscriptionChange: true,
  emailOnUsageLimit: true,
  emailMarketing: false,
  emailNewsletter: false,
};

function transformToApiResponse(dbSettings: {
  email_on_publish_success: boolean;
  email_on_publish_fail: boolean;
  email_on_subscription_change: boolean;
  email_on_usage_limit: boolean;
  email_marketing: boolean;
  email_newsletter: boolean;
}): NotificationSettings {
  return {
    emailOnPublishSuccess: dbSettings.email_on_publish_success,
    emailOnPublishFail: dbSettings.email_on_publish_fail,
    emailOnSubscriptionChange: dbSettings.email_on_subscription_change,
    emailOnUsageLimit: dbSettings.email_on_usage_limit,
    emailMarketing: dbSettings.email_marketing,
    emailNewsletter: dbSettings.email_newsletter,
  };
}

/**
 * GET /api/notifications
 * 알림 설정 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 데이터베이스 오류 처리 (not found 제외)
    if (error && error.code !== 'PGRST116') {
      console.error('Get notification settings error:', error);
      return NextResponse.json(
        { success: false, error: '알림 설정 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (error?.code === 'PGRST116' || !settings) {
      // 설정이 없으면 기본값 반환
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      success: true,
      settings: transformToApiResponse(settings),
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      { success: false, error: '알림 설정 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * 알림 설정 업데이트
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 유효성 검사
    const validFields = [
      'emailOnPublishSuccess',
      'emailOnPublishFail',
      'emailOnSubscriptionChange',
      'emailOnUsageLimit',
      'emailMarketing',
      'emailNewsletter',
    ];

    const updateData: Record<string, boolean> = {};

    for (const field of validFields) {
      if (field in body) {
        if (typeof body[field] !== 'boolean') {
          return NextResponse.json(
            { success: false, error: `유효하지 않은 값: ${field}는 boolean이어야 합니다.` },
            { status: 400 }
          );
        }
      }
    }

    // camelCase를 snake_case로 변환
    if ('emailOnPublishSuccess' in body) {
      updateData.email_on_publish_success = body.emailOnPublishSuccess;
    }
    if ('emailOnPublishFail' in body) {
      updateData.email_on_publish_fail = body.emailOnPublishFail;
    }
    if ('emailOnSubscriptionChange' in body) {
      updateData.email_on_subscription_change = body.emailOnSubscriptionChange;
    }
    if ('emailOnUsageLimit' in body) {
      updateData.email_on_usage_limit = body.emailOnUsageLimit;
    }
    if ('emailMarketing' in body) {
      updateData.email_marketing = body.emailMarketing;
    }
    if ('emailNewsletter' in body) {
      updateData.email_newsletter = body.emailNewsletter;
    }

    // upsert로 저장 (없으면 생성, 있으면 업데이트)
    const { data: savedSettings, error } = await supabase
      .from('notification_settings')
      .upsert(
        {
          user_id: user.id,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Update notification settings error:', error);
      return NextResponse.json(
        { success: false, error: '알림 설정 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '알림 설정이 업데이트되었습니다.',
      settings: transformToApiResponse(savedSettings),
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { success: false, error: '알림 설정 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
