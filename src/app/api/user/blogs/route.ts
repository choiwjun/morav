import { NextResponse } from 'next/server';
import { getUserBlogs } from '@/lib/actions/blog';

export async function GET() {
  try {
    const result = await getUserBlogs();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      blogs: result.blogs?.map((blog) => ({
        id: blog.id,
        name: blog.blog_name,
        url: blog.blog_url,
        platform: blog.platform,
        categories: blog.categories || [],
        is_active: blog.is_active,
        created_at: blog.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('User blogs API error:', error);
    return NextResponse.json(
      { error: '블로그 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
