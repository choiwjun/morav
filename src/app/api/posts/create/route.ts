import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishAndUpdatePost } from '@/lib/blog';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { blogId, title, content, keyword, status, scheduledAt } = body;

    // 필수 필드 검증
    if (!blogId) {
      return NextResponse.json(
        { success: false, error: '블로그를 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 블로그 소유권 확인
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id, user_id')
      .eq('id', blogId)
      .eq('user_id', user.id)
      .single();

    if (blogError || !blog) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 블로그입니다.' },
        { status: 400 }
      );
    }

    // 사용량 체크 (월간 발행 한도)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, monthly_limit')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscription) {
      // 이번 달 발행 수 확인
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .not('status', 'eq', 'pending');

      if (count !== null && subscription.monthly_limit && count >= subscription.monthly_limit) {
        return NextResponse.json(
          { success: false, error: '이번 달 발행 한도에 도달했습니다. 플랜을 업그레이드해주세요.' },
          { status: 400 }
        );
      }
    }

    // 상태 검증
    const validStatuses = ['draft', 'pending', 'scheduled'];
    const postStatus = validStatuses.includes(status) ? status : 'pending';

    // 예약 발행 시간 검증
    let scheduledAtValue = null;
    if (postStatus === 'scheduled') {
      if (!scheduledAt) {
        return NextResponse.json(
          { success: false, error: '예약 발행 시간을 설정해주세요.' },
          { status: 400 }
        );
      }
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return NextResponse.json(
          { success: false, error: '예약 발행 시간은 현재 시간 이후여야 합니다.' },
          { status: 400 }
        );
      }
      scheduledAtValue = scheduledDate.toISOString();
    }

    // 키워드 처리 (있으면 keywords 테이블에서 찾거나 생성)
    let keywordId = null;
    if (keyword && keyword.trim()) {
      // 기존 키워드 찾기
      const { data: existingKeyword } = await supabase
        .from('keywords')
        .select('id')
        .eq('user_id', user.id)
        .eq('keyword', keyword.trim())
        .single();

      if (existingKeyword) {
        keywordId = existingKeyword.id;
      }
      // 키워드가 없으면 keywordId는 null로 유지 (키워드 테이블은 트렌드 수집용)
    }

    // 포스트 생성
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        blog_id: blogId,
        keyword_id: keywordId,
        title: title.trim(),
        content: content.trim(),
        status: postStatus,
        scheduled_at: scheduledAtValue,
      })
      .select('id')
      .single();

    if (postError || !post) {
      console.error('Create post error:', postError);
      return NextResponse.json(
        { success: false, error: '포스트 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 즉시 발행인 경우 바로 발행 실행
    if (postStatus === 'pending') {
      try {
        const publishResult = await publishAndUpdatePost(post.id);

        if (publishResult.success) {
          return NextResponse.json({
            success: true,
            post: {
              id: post.id,
              url: publishResult.postUrl,
            },
            message: '발행이 완료되었습니다.',
          });
        } else {
          // 발행 실패해도 포스트는 생성됨 - 400으로 반환하고 에러 메시지 전달
          return NextResponse.json({
            success: false,
            post: { id: post.id },
            error: publishResult.error || '발행에 실패했습니다. 포스트는 저장되었습니다.',
          }, { status: 400 });
        }
      } catch (publishError) {
        console.error('Publish error:', publishError);
        // 발행 중 예외 발생해도 포스트는 생성됨
        return NextResponse.json({
          success: false,
          post: { id: post.id },
          error: '발행 중 오류가 발생했습니다. 포스트는 저장되었습니다.',
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
      },
      message:
        postStatus === 'draft'
          ? '임시 저장되었습니다.'
          : '예약 발행이 설정되었습니다.',
    });
  } catch (error) {
    console.error('Create post API error:', error);
    return NextResponse.json(
      { success: false, error: '포스트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
