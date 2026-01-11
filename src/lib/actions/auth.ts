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

// RFC 5322 기반 이메일 검증 정규식
function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// 비밀번호 복잡성 검증: 8자 이상, 대문자, 소문자, 숫자 포함
function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: '비밀번호에 대문자를 포함해주세요.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: '비밀번호에 소문자를 포함해주세요.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '비밀번호에 숫자를 포함해주세요.' };
  }
  return { valid: true };
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || !isValidEmail(email)) {
    return { success: false, error: '유효한 이메일 주소를 입력해주세요.' };
  }

  if (typeof password !== 'string') {
    return { success: false, error: '비밀번호를 입력해주세요.' };
  }

  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
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
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || !email) {
    return { success: false, error: '이메일을 입력해주세요.' };
  }

  if (typeof password !== 'string' || !password) {
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
  const email = formData.get('email');

  if (typeof email !== 'string' || !isValidEmail(email)) {
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
  const password = formData.get('password');

  if (typeof password !== 'string') {
    return { success: false, error: '비밀번호를 입력해주세요.' };
  }

  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
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
