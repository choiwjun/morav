import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retryFailedPost } from '@/lib/blog';

export const dynamic = 'force-dynamic';

/**
 * POST /api/posts/[id]/retry
 * 실패한 포스트 수동 재시도
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: '포스트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

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

    // 포스트 소유권 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, status, user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: '포스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 실패한 포스트만 재시도 가능
    if (post.status !== 'failed') {
      return NextResponse.json(
        { success: false, error: '실패한 포스트만 재시도할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 재시도 실행
    const result = await retryFailedPost(postId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        postUrl: result.postUrl,
        message: '포스트가 성공적으로 발행되었습니다.',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || '재시도에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Retry post error:', error);
    return NextResponse.json(
      { success: false, error: '재시도 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
