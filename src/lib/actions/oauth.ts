'use server';

import { createClient } from '@/lib/supabase/server';

interface OAuthResult {
  success: boolean;
  error?: string;
  url?: string;
  user?: {
    id: string;
    email?: string | null;
  } | null;
}

export async function signInWithGoogle(): Promise<OAuthResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, url: data.url };
}

export async function handleOAuthCallback(code: string): Promise<OAuthResult> {
  if (!code) {
    return { success: false, error: '인증 코드가 없습니다.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.session?.user };
}
