import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { blogName, blogId, apiKey } = body;

    if (!blogName || !blogId || !apiKey) {
      return NextResponse.json(
        { error: '블로그 이름, Blog ID, API Key를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // API Key 암호화
    const encryptedApiKey = encrypt(apiKey);

    // Blog ID를 URL로 변환
    const blogUrl = `https://www.blogger.com/blog/posts/${blogId}`;

    // 블로그 저장 (upsert) - blog_id를 별도 필드에 저장
    const { data: savedBlog, error: upsertError } = await supabase
      .from('blogs')
      .upsert(
        {
          user_id: user.id,
          platform: 'blogger',
          blog_name: blogName.slice(0, 100),
          blog_url: blogUrl.slice(0, 255),
          access_token: encryptedApiKey, // API Key를 access_token 필드에 저장
          external_blog_id: blogId, // Blog ID 저장
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
      return NextResponse.json({ error: '블로그 정보 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: savedBlog.id,
        platform: savedBlog.platform,
        blog_name: savedBlog.blog_name,
        blog_url: savedBlog.blog_url,
      },
    });
  } catch (error) {
    console.error('Blogger connect error:', error);
    return NextResponse.json({ error: '구글 블로거 연결 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
