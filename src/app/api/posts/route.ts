import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || undefined;
    const blogId = searchParams.get('blogId') || undefined;
    const search = searchParams.get('search') || undefined;
    const dateFilter = searchParams.get('dateFilter') || 'all'; // 'today', 'week', 'month', 'all'

    // limit 검증
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    // 쿼리 빌드
    let query = supabase
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
        blogs!inner (
          id,
          blog_name,
          platform
        ),
        keywords (
          keyword
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + safeLimit - 1);

    // 상태 필터
    if (status && status !== 'all') {
      type PostStatus = 'pending' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
      const validStatuses: PostStatus[] = [
        'pending',
        'generating',
        'generated',
        'publishing',
        'published',
        'failed',
      ];
      // 타입 가드 함수로 안전하게 검증
      const isValidStatus = (s: string): s is PostStatus => {
        return validStatuses.includes(s as PostStatus);
      };
      if (isValidStatus(status)) {
        query = query.eq('status', status);
      }
    }

    // 블로그 필터
    if (blogId && blogId !== 'all') {
      query = query.eq('blog_id', blogId);
    }

    // 검색 필터 (제목 검색)
    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    // 기간 필터
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      if (dateFilter === 'today') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateFilter === 'month') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate = new Date(0);
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: posts, error: postsError, count } = await query;

    if (postsError) {
      console.error('Get posts error:', postsError);
      return NextResponse.json(
        { error: '포스트 목록 조회에 실패했습니다.' },
        { status: 400 }
      );
    }

    const formattedPosts = (posts || []).map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
      publishedUrl: post.published_url,
      scheduledAt: post.scheduled_at,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      blog: {
        id: (post.blogs as { id: string; blog_name: string; platform: string }).id,
        name: (post.blogs as { id: string; blog_name: string; platform: string })
          .blog_name,
        platform: (post.blogs as { id: string; blog_name: string; platform: string })
          .platform,
      },
      keyword:
        post.keywords && Array.isArray(post.keywords) && post.keywords.length > 0
          ? (post.keywords[0] as { keyword: string }).keyword
          : null,
    }));

    const totalPages = count ? Math.ceil(count / safeLimit) : 1;

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json(
      { error: '포스트 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
