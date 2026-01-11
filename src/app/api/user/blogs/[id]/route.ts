import { NextRequest, NextResponse } from 'next/server';
import { disconnectBlog } from '@/lib/actions/blog';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: '블로그 ID가 필요합니다.' }, { status: 400 });
    }

    const result = await disconnectBlog(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json(
      { error: '블로그 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}