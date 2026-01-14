import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // 사용자 목록 조회 (구독 정보 포함)
    let query = supabase
      .from('users')
      .select(
        `
        id,
        email,
        name,
        created_at,
        subscriptions (
          id,
          plan,
          status,
          usage_count,
          monthly_limit
        ),
        blogs (
          id,
          platform,
          is_active
        )
      `,
        { count: 'exact' }
      );

    // 검색 필터
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: users, count, error } = await query;

    if (error) {
      console.error('Users query error:', error);
      return NextResponse.json({ error: '사용자 목록 조회에 실패했습니다.' }, { status: 500 });
    }

    // 데이터 가공
    const formattedUsers = users?.map((user) => {
      const subscription = Array.isArray(user.subscriptions)
        ? user.subscriptions[0]
        : user.subscriptions;
      const blogs = Array.isArray(user.blogs) ? user.blogs : [];

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              usageCount: subscription.usage_count,
              monthlyLimit: subscription.monthly_limit,
            }
          : null,
        blogCount: blogs.length,
        activeBlogCount: blogs.filter((b: { is_active: boolean }) => b.is_active).length,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: '사용자 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
