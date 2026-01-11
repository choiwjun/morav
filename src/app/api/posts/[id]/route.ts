import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/posts/[id]
 * 포스트 상세 조회
 */
export async function GET(
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

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(
        `
        id,
        title,
        content,
        status,
        published_url,
        scheduled_at,
        published_at,
        created_at,
        updated_at,
        retry_count,
        error_message,
        blogs!inner (
          id,
          blog_name,
          platform,
          blog_url
        ),
        keywords (
          keyword
        )
      `
      )
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: '포스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
      publishedUrl: post.published_url,
      scheduledAt: post.scheduled_at,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      retryCount: post.retry_count,
      errorMessage: post.error_message,
      blog: {
        id: (post.blogs as { id: string; blog_name: string; platform: string; blog_url: string }).id,
        name: (post.blogs as { id: string; blog_name: string; platform: string; blog_url: string }).blog_name,
        platform: (post.blogs as { id: string; blog_name: string; platform: string; blog_url: string }).platform,
        url: (post.blogs as { id: string; blog_name: string; platform: string; blog_url: string }).blog_url,
      },
      keyword:
        post.keywords && Array.isArray(post.keywords) && post.keywords.length > 0
          ? (post.keywords[0] as { keyword: string }).keyword
          : null,
    };

    return NextResponse.json({
      success: true,
      post: formattedPost,
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { success: false, error: '포스트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id]
 * 포스트 삭제
 */
export async function DELETE(
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

    // 포스트 소유권 확인 및 삭제
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete post error:', deleteError);
      return NextResponse.json(
        { success: false, error: '포스트 삭제에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '포스트가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { success: false, error: '포스트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
