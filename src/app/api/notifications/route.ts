import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// 프론트엔드와 동일한 snake_case 필드명 사용
interface NotificationSettings {
  // 이메일 알림
  email_on_publish_success: boolean;
  email_on_publish_fail: boolean;
  email_on_subscription_change: boolean;
  email_on_usage_limit: boolean;
  // 주간 리포트
  email_weekly_report: boolean;
  // 마케팅 알림
  email_marketing: boolean;
  email_product_updates: boolean;
  // 앱 푸시 알림
  push_enabled: boolean;
  push_on_publish: boolean;
  push_on_important: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email_on_publish_success: true,
  email_on_publish_fail: true,
  email_on_subscription_change: true,
  email_on_usage_limit: true,
  email_weekly_report: true,
  email_marketing: false,
  email_product_updates: true,
  push_enabled: false,
  push_on_publish: true,
  push_on_important: true,
};

// DB 필드명 목록 (유효성 검사용)
const VALID_FIELDS = [
  'email_on_publish_success',
  'email_on_publish_fail',
  'email_on_subscription_change',
  'email_on_usage_limit',
  'email_weekly_report',
  'email_marketing',
  'email_product_updates',
  'push_enabled',
  'push_on_publish',
  'push_on_important',
] as const;

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

    // DB에서 가져온 설정을 기본값과 병합 (새 필드 지원)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbSettings = settings as Record<string, any>;
    const mergedSettings: NotificationSettings = {
      ...DEFAULT_SETTINGS,
      email_on_publish_success: dbSettings.email_on_publish_success ?? DEFAULT_SETTINGS.email_on_publish_success,
      email_on_publish_fail: dbSettings.email_on_publish_fail ?? DEFAULT_SETTINGS.email_on_publish_fail,
      email_on_subscription_change: dbSettings.email_on_subscription_change ?? DEFAULT_SETTINGS.email_on_subscription_change,
      email_on_usage_limit: dbSettings.email_on_usage_limit ?? DEFAULT_SETTINGS.email_on_usage_limit,
      email_weekly_report: dbSettings.email_weekly_report ?? DEFAULT_SETTINGS.email_weekly_report,
      email_marketing: dbSettings.email_marketing ?? DEFAULT_SETTINGS.email_marketing,
      email_product_updates: dbSettings.email_product_updates ?? DEFAULT_SETTINGS.email_product_updates,
      push_enabled: dbSettings.push_enabled ?? DEFAULT_SETTINGS.push_enabled,
      push_on_publish: dbSettings.push_on_publish ?? DEFAULT_SETTINGS.push_on_publish,
      push_on_important: dbSettings.push_on_important ?? DEFAULT_SETTINGS.push_on_important,
    };

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
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

    // 유효성 검사 및 업데이트 데이터 구성 (snake_case 필드명 직접 사용)
    const updateData: Record<string, boolean> = {};

    for (const field of VALID_FIELDS) {
      if (field in body) {
        if (typeof body[field] !== 'boolean') {
          return NextResponse.json(
            { success: false, error: `유효하지 않은 값: ${field}는 boolean이어야 합니다.` },
            { status: 400 }
          );
        }
        updateData[field] = body[field];
      }
    }

    // 업데이트할 데이터가 없는 경우
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: '업데이트할 설정이 없습니다.' },
        { status: 400 }
      );
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

    // 저장된 설정을 기본값과 병합하여 반환
    const mergedSettings: NotificationSettings = {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
    };

    return NextResponse.json({
      success: true,
      message: '알림 설정이 업데이트되었습니다.',
      settings: mergedSettings,
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { success: false, error: '알림 설정 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
