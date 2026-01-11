'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface ProfileResult {
  success: boolean;
  error?: string;
  profile?: UserProfile | null;
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

  const name = formData.get('name') as string | null;
  const avatarUrl = formData.get('avatar_url') as string | null;

  const updateData: Partial<Database['public']['Tables']['users']['Update']> = {
    updated_at: new Date().toISOString(),
  };

  if (name !== null) {
    updateData.name = name;
  }

  if (avatarUrl !== null) {
    updateData.avatar_url = avatarUrl;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, profile: data };
}
