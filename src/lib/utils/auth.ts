/**
 * 공통 인증 유틸리티
 * Supabase 인증 관련 공통 로직을 제공합니다.
 */

import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

interface AuthResult {
  user: User | null;
  error: string | null;
}

/**
 * 현재 로그인한 사용자를 가져옵니다.
 * 로그인되지 않은 경우 error를 반환합니다.
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Auth error:', error);
      return { user: null, error: '인증 확인 중 오류가 발생했습니다.' };
    }

    if (!user) {
      return { user: null, error: '로그인이 필요합니다.' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Get authenticated user error:', error);
    return { user: null, error: '인증 확인 중 오류가 발생했습니다.' };
  }
}

/**
 * 인증이 필요한 Server Action을 래핑합니다.
 */
export async function withAuth<T>(
  action: (user: User) => Promise<T>,
  unauthorizedResult: T
): Promise<T> {
  const { user, error } = await getAuthenticatedUser();

  if (!user || error) {
    return unauthorizedResult;
  }

  return action(user);
}
