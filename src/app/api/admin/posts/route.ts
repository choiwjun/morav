import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // 관리자용 클라이언트 사용 (RLS 우회)
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 포스트 목록 조회 (사용자, 블로그 정보 포함)
    let query = supabase
      .from('posts')
      .select(
        `
        id,
        title,
        status,
        published_url,
        published_at,
        scheduled_at,
        error_message,
        retry_count,
        created_at,
        users (
          email,
          name
        ),
        blogs (
          platform,
          blog_name,
          blog_url
        )
      `,
        { count: 'exact' }
      );

    // 상태 필터
    if (status) {
      query = query.eq('status', status as 'draft' | 'pending' | 'scheduled' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed');
    }

    // 검색 필터 (제목으로)
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // 정렬 (최신순)
    query = query.order('created_at', { ascending: false });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: posts, count, error } = await query;

    if (error) {
      console.error('Posts query error:', error);
      return NextResponse.json({ error: '포스트 목록 조회에 실패했습니다.' }, { status: 500 });
    }

    // 통계 조회
    const { data: statsData } = await supabase.from('posts').select('status');

    const stats = {
      total: statsData?.length || 0,
      published: statsData?.filter((p) => p.status === 'published').length || 0,
      failed: statsData?.filter((p) => p.status === 'failed').length || 0,
      pending: statsData?.filter((p) =>
        ['pending', 'generating', 'generated', 'publishing', 'scheduled'].includes(p.status)
      ).length || 0,
      draft: statsData?.filter((p) => p.status === 'draft').length || 0,
    };

    // 데이터 가공
    const formattedPosts = posts?.map((post) => {
      const user = post.users as { email: string; name: string | null } | null;
      const blog = post.blogs as { platform: string; blog_name: string; blog_url: string } | null;

      return {
        id: post.id,
        title: post.title,
        status: post.status,
        publishedUrl: post.published_url,
        publishedAt: post.published_at,
        scheduledAt: post.scheduled_at,
        errorMessage: post.error_message,
        retryCount: post.retry_count,
        createdAt: post.created_at,
        user: user
          ? {
              email: user.email,
              name: user.name,
            }
          : null,
        blog: blog
          ? {
              platform: blog.platform,
              blogName: blog.blog_name,
              blogUrl: blog.blog_url,
            }
          : null,
      };
    });

    return NextResponse.json({
      posts: formattedPosts,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin posts error:', error);
    return NextResponse.json({ error: '포스트 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
