import { NextRequest, NextResponse } from 'next/server';
import { disconnectBlog } from '@/lib/actions/blog';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;

    if (!blogId) {
      return NextResponse.json({ error: '블로그 ID가 필요합니다.' }, { status: 400 });
    }

    const result = await disconnectBlog(blogId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json({ error: '블로그 연결 해제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
