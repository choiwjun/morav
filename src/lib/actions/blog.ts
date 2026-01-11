'use server';

import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';
import { fetchWithTimeout } from '@/lib/utils/fetch';
import { getRequiredEnv, getAppUrl, isTistoryConfigured, isBloggerConfigured } from '@/lib/utils/env';
import { isValidUrl, isValidBlogName, MAX_LENGTHS } from '@/lib/utils/validation';

// OAuth 설정을 지연 로딩하는 함수들
function getTistoryConfig() {
  return {
    clientId: getRequiredEnv('TISTORY_CLIENT_ID'),
    clientSecret: getRequiredEnv('TISTORY_CLIENT_SECRET'),
    redirectUri: `${getAppUrl()}/api/blog/tistory/callback`,
  };
}

function getBloggerConfig() {
  return {
    clientId: getRequiredEnv('GOOGLE_CLIENT_ID'),
    clientSecret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: `${getAppUrl()}/api/blog/blogger/callback`,
  };
}

interface BlogResult {
  success: boolean;
  url?: string;
  blog?: {
    id: string;
    platform: string;
    blog_name: string;
    blog_url: string;
  };
  blogs?: Array<{
    id: string;
    platform: string;
    blog_name: string;
    blog_url: string;
    categories?: string[];
    is_active: boolean;
    created_at?: string;
  }>;
  error?: string;
}

interface WordpressCredentials {
  blogUrl: string;
  username: string;
  applicationPassword: string;
}

// ==================== Tistory ====================

export async function connectTistory(): Promise<BlogResult> {
  try {
    // 설정 검증
    if (!isTistoryConfigured()) {
      return { success: false, error: '티스토리 OAuth 설정이 완료되지 않았습니다.' };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const config = getTistoryConfig();

    // OAuth state 생성 (CSRF 방지)
    const state = crypto.randomUUID();

    // state를 사용자 메타데이터에 저장
    await supabase.auth.updateUser({
      data: { oauth_state: state, oauth_state_expires: Date.now() + 10 * 60 * 1000 }, // 10분 유효
    });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      state,
    });

    const url = `https://www.tistory.com/oauth/authorize?${params.toString()}`;

    return { success: true, url };
  } catch (error) {
    console.error('Tistory connect error:', error);
    return { success: false, error: '티스토리 연결 중 오류가 발생했습니다.' };
  }
}

export async function handleTistoryCallback(code: string, state?: string): Promise<BlogResult> {
  if (!code) {
    return { success: false, error: '인증 코드가 없습니다.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // OAuth state 검증 (CSRF 방지)
    const storedState = user.user_metadata?.oauth_state;
    const stateExpires = user.user_metadata?.oauth_state_expires;

    if (!state || !storedState || state !== storedState) {
      return { success: false, error: '잘못된 인증 요청입니다. 다시 시도해주세요.' };
    }

    if (stateExpires && Date.now() > stateExpires) {
      return { success: false, error: '인증 요청이 만료되었습니다. 다시 시도해주세요.' };
    }

    // state 사용 후 삭제
    await supabase.auth.updateUser({
      data: { oauth_state: null, oauth_state_expires: null },
    });

    const config = getTistoryConfig();

    // Exchange code for access token (with timeout)
    const tokenResponse = await fetchWithTimeout('https://www.tistory.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
      timeout: 15000, // 15초 타임아웃
    });

    if (!tokenResponse.ok) {
      return { success: false, error: '티스토리 인증에 실패했습니다.' };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return { success: false, error: '티스토리 액세스 토큰을 받지 못했습니다.' };
    }

    // Get blog info (with timeout)
    const blogInfoResponse = await fetchWithTimeout(
      `https://www.tistory.com/apis/blog/info?access_token=${accessToken}&output=json`,
      { timeout: 15000 }
    );

    if (!blogInfoResponse.ok) {
      return { success: false, error: '티스토리 블로그 정보를 가져오는데 실패했습니다.' };
    }

    const blogInfoData = await blogInfoResponse.json();
    const blogs = blogInfoData.tistory?.item?.blogs;

    if (!blogs || blogs.length === 0) {
      return { success: false, error: '연결할 티스토리 블로그가 없습니다.' };
    }

    const blog = blogs[0];
    const blogName = (blog.title || blog.name || '').slice(0, MAX_LENGTHS.BLOG_NAME);
    const blogUrl = (blog.url || '').slice(0, MAX_LENGTHS.URL);
    const encryptedToken = encrypt(accessToken);

    // Upsert blog connection (중복 처리)
    const { data: savedBlog, error: upsertError } = await supabase
      .from('blogs')
      .upsert(
        {
          user_id: user.id,
          platform: 'tistory',
          blog_name: blogName,
          blog_url: blogUrl,
          access_token: encryptedToken,
          is_active: true,
        },
        {
          onConflict: 'user_id,platform,blog_url',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Blog upsert error:', upsertError);
      return { success: false, error: '블로그 정보 저장에 실패했습니다.' };
    }

    return {
      success: true,
      blog: {
        id: savedBlog.id,
        platform: savedBlog.platform,
        blog_name: savedBlog.blog_name,
        blog_url: savedBlog.blog_url,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '티스토리 서버 응답이 없습니다. 나중에 다시 시도해주세요.' };
    }
    console.error('Tistory callback error:', error);
    return { success: false, error: '티스토리 연결 중 오류가 발생했습니다.' };
  }
}

// ==================== Google Blogger ====================

export async function connectBlogger(): Promise<BlogResult> {
  try {
    // 설정 검증
    if (!isBloggerConfigured()) {
      return { success: false, error: '구글 블로거 OAuth 설정이 완료되지 않았습니다.' };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const config = getBloggerConfig();

    // OAuth state 생성 (CSRF 방지)
    const state = crypto.randomUUID();

    // state를 사용자 메타데이터에 저장
    await supabase.auth.updateUser({
      data: { oauth_state: state, oauth_state_expires: Date.now() + 10 * 60 * 1000 }, // 10분 유효
    });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/blogger',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return { success: true, url };
  } catch (error) {
    console.error('Blogger connect error:', error);
    return { success: false, error: '구글 블로거 연결 중 오류가 발생했습니다.' };
  }
}

export async function handleBloggerCallback(code: string, state?: string): Promise<BlogResult> {
  if (!code) {
    return { success: false, error: '인증 코드가 없습니다.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // OAuth state 검증 (CSRF 방지)
    const storedState = user.user_metadata?.oauth_state;
    const stateExpires = user.user_metadata?.oauth_state_expires;

    if (!state || !storedState || state !== storedState) {
      return { success: false, error: '잘못된 인증 요청입니다. 다시 시도해주세요.' };
    }

    if (stateExpires && Date.now() > stateExpires) {
      return { success: false, error: '인증 요청이 만료되었습니다. 다시 시도해주세요.' };
    }

    // state 사용 후 삭제
    await supabase.auth.updateUser({
      data: { oauth_state: null, oauth_state_expires: null },
    });

    const config = getBloggerConfig();

    // Exchange code for access token (with timeout)
    const tokenResponse = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
      timeout: 15000,
    });

    if (!tokenResponse.ok) {
      return { success: false, error: '구글 블로거 인증에 실패했습니다.' };
    }

    const tokenData = await tokenResponse.json();
    const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenData;

    if (!accessToken) {
      return { success: false, error: '구글 블로거 액세스 토큰을 받지 못했습니다.' };
    }

    // Get blog list (with timeout)
    const blogListResponse = await fetchWithTimeout('https://www.googleapis.com/blogger/v3/users/self/blogs', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 15000,
    });

    if (!blogListResponse.ok) {
      return { success: false, error: '구글 블로거 정보를 가져오는데 실패했습니다.' };
    }

    const blogListData = await blogListResponse.json();
    const blogs = blogListData.items;

    if (!blogs || blogs.length === 0) {
      return { success: false, error: '연결할 구글 블로거가 없습니다.' };
    }

    const blog = blogs[0];
    const blogName = (blog.name || '').slice(0, MAX_LENGTHS.BLOG_NAME);
    const blogUrl = (blog.url || '').slice(0, MAX_LENGTHS.URL);
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Upsert blog connection (중복 처리)
    const { data: savedBlog, error: upsertError } = await supabase
      .from('blogs')
      .upsert(
        {
          user_id: user.id,
          platform: 'blogger',
          blog_name: blogName,
          blog_url: blogUrl,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          is_active: true,
        },
        {
          onConflict: 'user_id,platform,blog_url',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Blog upsert error:', upsertError);
      return { success: false, error: '블로그 정보 저장에 실패했습니다.' };
    }

    return {
      success: true,
      blog: {
        id: savedBlog.id,
        platform: savedBlog.platform,
        blog_name: savedBlog.blog_name,
        blog_url: savedBlog.blog_url,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '구글 블로거 서버 응답이 없습니다. 나중에 다시 시도해주세요.' };
    }
    console.error('Blogger callback error:', error);
    return { success: false, error: '구글 블로거 연결 중 오류가 발생했습니다.' };
  }
}

// ==================== WordPress ====================

export async function connectWordpress(credentials: WordpressCredentials): Promise<BlogResult> {
  const { blogUrl, username, applicationPassword } = credentials;

  // 입력 길이 검증
  if (!isValidUrl(blogUrl)) {
    return { success: false, error: '올바른 블로그 URL을 입력해주세요.' };
  }

  if (!isValidBlogName(username)) {
    return { success: false, error: '사용자명이 너무 깁니다.' };
  }

  if (applicationPassword.length > MAX_LENGTHS.API_KEY) {
    return { success: false, error: '애플리케이션 비밀번호가 너무 깁니다.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // Normalize blog URL
    const normalizedUrl = blogUrl.endsWith('/') ? blogUrl.slice(0, -1) : blogUrl;

    // Verify credentials by calling WordPress REST API (with timeout)
    const authHeader = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
    const verifyResponse = await fetchWithTimeout(`${normalizedUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
      timeout: 15000,
    });

    if (!verifyResponse.ok) {
      return {
        success: false,
        error: '워드프레스 인증에 실패했습니다. 사용자명과 애플리케이션 비밀번호를 확인해주세요.',
      };
    }

    const userData = await verifyResponse.json();

    // Get site info (with timeout)
    const siteResponse = await fetchWithTimeout(`${normalizedUrl}/wp-json`, { timeout: 15000 });
    const siteData = await siteResponse.json();

    const blogName = (siteData.name || userData.name || 'WordPress Blog').slice(0, MAX_LENGTHS.BLOG_NAME);

    // Encrypt credentials
    const encryptedCredentials = encrypt(`${username}:${applicationPassword}`);

    // Upsert blog connection (중복 처리)
    const { data: savedBlog, error: upsertError } = await supabase
      .from('blogs')
      .upsert(
        {
          user_id: user.id,
          platform: 'wordpress',
          blog_name: blogName,
          blog_url: normalizedUrl.slice(0, MAX_LENGTHS.URL),
          access_token: encryptedCredentials,
          is_active: true,
        },
        {
          onConflict: 'user_id,platform,blog_url',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Blog upsert error:', upsertError);
      return { success: false, error: '블로그 정보 저장에 실패했습니다.' };
    }

    return {
      success: true,
      blog: {
        id: savedBlog.id,
        platform: savedBlog.platform,
        blog_name: savedBlog.blog_name,
        blog_url: savedBlog.blog_url,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '워드프레스 서버 응답이 없습니다. 나중에 다시 시도해주세요.' };
    }
    console.error('WordPress connect error:', error);
    return { success: false, error: '워드프레스 연결 중 오류가 발생했습니다.' };
  }
}

// ==================== Blog Management ====================

export async function disconnectBlog(blogId: string): Promise<BlogResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { error: deleteError } = await supabase
      .from('blogs')
      .delete()
      .eq('id', blogId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Blog delete error:', deleteError);
      return { success: false, error: '블로그 연결 해제에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Disconnect blog error:', error);
    return { success: false, error: '블로그 연결 해제 중 오류가 발생했습니다.' };
  }
}

export async function getUserBlogs(): Promise<BlogResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: blogs, error: selectError } = await supabase
      .from('blogs')
      .select('id, platform, blog_name, blog_url, categories, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (selectError) {
      console.error('Get blogs error:', selectError);
      return { success: false, error: '블로그 목록을 가져오는데 실패했습니다.' };
    }

    return { success: true, blogs: blogs || [] };
  } catch (error) {
    console.error('Get user blogs error:', error);
    return { success: false, error: '블로그 목록을 가져오는 중 오류가 발생했습니다.' };
  }
}
