import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blogs
 * 연결된 블로그 목록 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('id, platform, blog_name, blog_url, categories, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get blogs error:', error);
      return NextResponse.json(
        { success: false, error: '블로그 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    const formattedBlogs = (blogs || []).map((blog) => ({
      id: blog.id,
      platform: blog.platform,
      platformName: getPlatformName(blog.platform),
      name: blog.blog_name,
      url: blog.blog_url,
      categories: blog.categories || [],
      isActive: blog.is_active,
      createdAt: blog.created_at,
      updatedAt: blog.updated_at,
    }));

    return NextResponse.json({
      success: true,
      blogs: formattedBlogs,
      count: formattedBlogs.length,
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    return NextResponse.json(
      { success: false, error: '블로그 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function getPlatformName(platform: string): string {
  switch (platform) {
    case 'tistory':
      return '티스토리';
    case 'blogger':
      return '구글 블로거';
    case 'wordpress':
      return '워드프레스';
    default:
      return platform;
  }
}
