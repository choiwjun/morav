import { createClient } from '@/lib/supabase/server';

const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailResult {
  sent: boolean;
  reason?: string;
  error?: string;
}

type NotificationSettingKey =
  | 'email_on_publish_success'
  | 'email_on_publish_fail'
  | 'email_on_subscription_change'
  | 'email_on_usage_limit';

async function checkNotificationEnabled(
  userId: string,
  settingKey: NotificationSettingKey
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select(settingKey)
      .eq('user_id', userId)
      .single();

    if (error || !settings) {
      // 설정이 없으면 기본값 true (알림 활성화)
      return true;
    }

    // 타입 단언으로 동적 키 접근
    const value = (settings as Record<string, boolean>)[settingKey];
    return value ?? true;
  } catch {
    return true;
  }
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'noreply@morav.app';

  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * 발행 성공 이메일 발송
 */
export async function sendPublishSuccessEmail(
  userId: string,
  email: string,
  postTitle: string,
  postUrl: string
): Promise<EmailResult> {
  const isEnabled = await checkNotificationEnabled(userId, 'email_on_publish_success');

  if (!isEnabled) {
    return { sent: false, reason: '알림이 비활성화되어 있습니다.' };
  }

  const subject = `[Morav] "${postTitle}" 포스트가 발행되었습니다`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">포스트 발행 완료</h2>
      <p>안녕하세요,</p>
      <p>아래 포스트가 성공적으로 발행되었습니다:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <strong>${postTitle}</strong>
      </div>
      <a href="${postUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        포스트 보기
      </a>
      <p style="margin-top: 24px; color: #666; font-size: 14px;">
        이 알림을 원하지 않으시면 <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">알림 설정</a>에서 변경하실 수 있습니다.
      </p>
    </div>
  `;

  const result = await sendEmail(email, subject, html);

  if (!result.success) {
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

/**
 * 발행 실패 이메일 발송
 */
export async function sendPublishFailEmail(
  userId: string,
  email: string,
  postTitle: string,
  errorMessage: string
): Promise<EmailResult> {
  const isEnabled = await checkNotificationEnabled(userId, 'email_on_publish_fail');

  if (!isEnabled) {
    return { sent: false, reason: '알림이 비활성화되어 있습니다.' };
  }

  const subject = `[Morav] "${postTitle}" 포스트 발행에 실패했습니다`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">포스트 발행 실패</h2>
      <p>안녕하세요,</p>
      <p>아래 포스트 발행 중 오류가 발생했습니다:</p>
      <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <strong>${postTitle}</strong>
        <p style="margin-top: 8px; color: #dc2626; font-size: 14px;">오류: ${errorMessage}</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/posts" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        포스트 관리로 이동
      </a>
      <p style="margin-top: 24px; color: #666; font-size: 14px;">
        이 알림을 원하지 않으시면 <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">알림 설정</a>에서 변경하실 수 있습니다.
      </p>
    </div>
  `;

  const result = await sendEmail(email, subject, html);

  if (!result.success) {
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

/**
 * 구독 변경 이메일 발송
 */
export async function sendSubscriptionChangeEmail(
  userId: string,
  email: string,
  oldPlan: string,
  newPlan: string
): Promise<EmailResult> {
  const isEnabled = await checkNotificationEnabled(userId, 'email_on_subscription_change');

  if (!isEnabled) {
    return { sent: false, reason: '알림이 비활성화되어 있습니다.' };
  }

  const planNames: Record<string, string> = {
    free: '무료 체험',
    light: 'Light',
    standard: 'Standard',
    pro: 'Pro',
    unlimited: 'Unlimited',
  };

  const subject = `[Morav] 구독 플랜이 변경되었습니다`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">구독 플랜 변경</h2>
      <p>안녕하세요,</p>
      <p>구독 플랜이 변경되었습니다:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><span style="color: #666;">이전 플랜:</span> <strong>${planNames[oldPlan] || oldPlan}</strong></p>
        <p style="margin: 8px 0 0 0;"><span style="color: #666;">새 플랜:</span> <strong style="color: #0066cc;">${planNames[newPlan] || newPlan}</strong></p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        구독 상세 보기
      </a>
      <p style="margin-top: 24px; color: #666; font-size: 14px;">
        이 알림을 원하지 않으시면 <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">알림 설정</a>에서 변경하실 수 있습니다.
      </p>
    </div>
  `;

  const result = await sendEmail(email, subject, html);

  if (!result.success) {
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

/**
 * 사용량 한도 임박 이메일 발송
 */
export async function sendUsageLimitEmail(
  userId: string,
  email: string,
  currentUsage: number,
  monthlyLimit: number
): Promise<EmailResult> {
  const isEnabled = await checkNotificationEnabled(userId, 'email_on_usage_limit');

  if (!isEnabled) {
    return { sent: false, reason: '알림이 비활성화되어 있습니다.' };
  }

  const remainingPosts = monthlyLimit - currentUsage;
  const subject = `[Morav] 이번 달 발행 한도가 임박했습니다`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">발행 한도 알림</h2>
      <p>안녕하세요,</p>
      <p>이번 달 발행 한도가 임박했습니다:</p>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><span style="color: #666;">사용량:</span> <strong>${currentUsage} / ${monthlyLimit}</strong></p>
        <p style="margin: 8px 0 0 0;"><span style="color: #666;">남은 발행:</span> <strong style="color: #f59e0b;">${remainingPosts}개</strong></p>
      </div>
      <p>더 많은 포스트를 발행하시려면 플랜을 업그레이드해 주세요.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/payment/plans" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        플랜 업그레이드
      </a>
      <p style="margin-top: 24px; color: #666; font-size: 14px;">
        이 알림을 원하지 않으시면 <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">알림 설정</a>에서 변경하실 수 있습니다.
      </p>
    </div>
  `;

  const result = await sendEmail(email, subject, html);

  if (!result.success) {
    return { sent: false, error: result.error };
  }

  return { sent: true };
}
