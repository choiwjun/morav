import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * 환경변수에서 관리자 이메일 목록 가져오기
 * ADMIN_EMAILS=admin@example.com,owner@example.com
 */
function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS || '';
  return adminEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * 이메일이 관리자인지 확인
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}

/**
 * 현재 사용자가 관리자인지 확인하고 사용자 정보 반환
 * 관리자가 아니면 /dashboard로 리다이렉트
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (!isAdmin(user.email)) {
    redirect('/dashboard');
  }

  return user;
}

/**
 * API 라우트에서 관리자 권한 확인
 * 관리자가 아니면 null 반환
 */
export async function checkAdminAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: '인증되지 않은 사용자입니다.', status: 401 };
  }

  if (!isAdmin(user.email)) {
    return { user: null, error: '관리자 권한이 필요합니다.', status: 403 };
  }

  return { user, error: null, status: 200 };
}
