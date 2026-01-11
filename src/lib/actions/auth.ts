'use server';

import { createClient } from '@/lib/supabase/server';

interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email?: string | null;
  } | null;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !isValidEmail(email)) {
    return { success: false, error: '유효한 이메일 주소를 입력해주세요.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

export async function login(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email) {
    return { success: false, error: '이메일을 입력해주세요.' };
  }

  if (!password) {
    return { success: false, error: '비밀번호를 입력해주세요.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

export async function logout(): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string;

  if (!email || !isValidEmail(email)) {
    return { success: false, error: '유효한 이메일 주소를 입력해주세요.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset/confirm`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const password = formData.get('password') as string;

  if (!password || password.length < 6) {
    return { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
