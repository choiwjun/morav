import { NextResponse } from 'next/server';
import { getUserBlogs } from '@/lib/actions/blog';

export async function GET() {
  try {
    const result = await getUserBlogs();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ blogs: result.blogs });
  } catch (error) {
    console.error('Get blogs error:', error);
    return NextResponse.json({ error: '블로그 목록을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
