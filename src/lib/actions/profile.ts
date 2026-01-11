'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface ProfileResult {
  success: boolean;
  error?: string;
  profile?: UserProfile | null;
}

// URL 검증 함수: 유효한 HTTP/HTTPS URL만 허용
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function getProfile(): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, profile: data };
}

export async function updateProfile(formData: FormData): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  const name = formData.get('name');
  const avatarUrl = formData.get('avatar_url');

  const updateData: Partial<Database['public']['Tables']['users']['Update']> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof name === 'string' && name.trim() !== '') {
    updateData.name = name.trim();
  } else if (name === '') {
    updateData.name = null;
  }

  if (typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
    if (!isValidUrl(avatarUrl)) {
      return { success: false, error: '유효한 URL 형식이 아닙니다.' };
    }
    updateData.avatar_url = avatarUrl.trim();
  } else if (avatarUrl === '') {
    updateData.avatar_url = null;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .select()
    .eq('id', user.id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, profile: data };
}
