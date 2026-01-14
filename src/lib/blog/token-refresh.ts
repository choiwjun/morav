/**
 * OAuth 토큰 갱신 유틸리티
 */

import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/crypto';

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  error?: string;
}

/**
 * Google Blogger 액세스 토큰 갱신
 */
export async function refreshBloggerToken(
  blogId: string,
  refreshToken: string
): Promise<RefreshResult> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Google OAuth 설정이 완료되지 않았습니다.' };
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error_description || '토큰 갱신에 실패했습니다.',
      };
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    if (!newAccessToken) {
      return { success: false, error: '새 액세스 토큰을 받지 못했습니다.' };
    }

    // DB에 새 토큰 저장
    const supabase = await createClient();
    const encryptedToken = encrypt(newAccessToken);
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('blogs')
      .update({
        access_token: encryptedToken,
        token_expires_at: expiresAt,
      })
      .eq('id', blogId);

    if (updateError) {
      console.error('Token update error:', updateError);
      // DB 저장 실패해도 새 토큰은 반환
    }

    return { success: true, accessToken: newAccessToken };
  } catch (error) {
    console.error('Refresh blogger token error:', error);
    return { success: false, error: '토큰 갱신 중 오류가 발생했습니다.' };
  }
}

/**
 * 토큰 만료 여부 확인 및 필요시 갱신
 */
export async function ensureValidToken(
  blogId: string,
  platform: string
): Promise<RefreshResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('access_token, refresh_token, token_expires_at')
      .eq('id', blogId)
      .eq('user_id', user.id)
      .single();

    if (blogError || !blog) {
      return { success: false, error: '블로그를 찾을 수 없습니다.' };
    }

    // 토큰 만료 확인 (5분 여유)
    const expiresAt = blog.token_expires_at ? new Date(blog.token_expires_at).getTime() : 0;
    const isExpired = expiresAt > 0 && expiresAt < Date.now() + 5 * 60 * 1000;

    if (!isExpired) {
      // 아직 만료되지 않음
      return { success: true, accessToken: decrypt(blog.access_token) };
    }

    // 토큰 갱신 필요
    if (!blog.refresh_token) {
      return { success: false, error: '갱신 토큰이 없습니다. 블로그를 다시 연결해주세요.' };
    }

    const refreshToken = decrypt(blog.refresh_token);

    // 플랫폼별 토큰 갱신
    switch (platform) {
      case 'blogger':
        return refreshBloggerToken(blogId, refreshToken);
      default:
        // 워드프레스 등은 장기 토큰 사용
        return { success: true, accessToken: decrypt(blog.access_token) };
    }
  } catch (error) {
    console.error('Ensure valid token error:', error);
    return { success: false, error: '토큰 확인 중 오류가 발생했습니다.' };
  }
}
