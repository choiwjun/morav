import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin';

// 사용자 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = await params;
    const supabase = createAdminClient();

    // 사용자 기본 정보
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 구독 정보
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 블로그 목록
    const { data: blogs } = await supabase
      .from('blogs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 포스트 목록 (최근 20개)
    const { data: posts, count: postCount } = await supabase
      .from('posts')
      .select('id, title, status, published_url, published_at, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // 결제 내역
    const { data: payments } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // API 키 목록
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('id, provider, is_valid, created_at, updated_at')
      .eq('user_id', userId);

    // 사용자 설정 (자동 생성 설정)
    const { data: settings } = await supabase
      .from('auto_generate_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            usageCount: subscription.usage_count,
            monthlyLimit: subscription.monthly_limit,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            createdAt: subscription.created_at,
            updatedAt: subscription.updated_at,
          }
        : null,
      blogs: blogs?.map((blog) => ({
        id: blog.id,
        platform: blog.platform,
        blogName: blog.blog_name,
        blogUrl: blog.blog_url,
        isActive: blog.is_active,
        createdAt: blog.created_at,
      })) || [],
      posts: {
        items: posts?.map((post) => ({
          id: post.id,
          title: post.title,
          status: post.status,
          publishedUrl: post.published_url,
          publishedAt: post.published_at,
          createdAt: post.created_at,
        })) || [],
        total: postCount || 0,
      },
      payments: payments?.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        plan: payment.plan,
        status: payment.status,
        paymentMethod: payment.method,
        createdAt: payment.created_at,
      })) || [],
      apiKeys: apiKeys?.map((key) => ({
        id: key.id,
        provider: key.provider,
        isActive: key.is_valid,
        createdAt: key.created_at,
        updatedAt: key.updated_at,
      })) || [],
      settings: settings
        ? {
            isEnabled: settings.is_enabled,
            preferredProvider: settings.preferred_provider,
            preferredCategories: settings.preferred_categories,
            postsPerDay: settings.posts_per_day,
            defaultBlogId: settings.default_blog_id,
          }
        : null,
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 사용자 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};

    // 사용자 기본 정보 수정
    if (body.user) {
      const userUpdates: Record<string, unknown> = {};
      if (body.user.name !== undefined) userUpdates.name = body.user.name;
      if (body.user.avatarUrl !== undefined) userUpdates.avatar_url = body.user.avatarUrl;

      if (Object.keys(userUpdates).length > 0) {
        userUpdates.updated_at = new Date().toISOString();
        const { error } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', userId);

        if (error) {
          console.error('User update error:', error);
          return NextResponse.json({ error: '사용자 정보 수정에 실패했습니다.' }, { status: 500 });
        }
        updates.user = userUpdates;
      }
    }

    // 구독 정보 수정
    if (body.subscription) {
      const subUpdates: Record<string, unknown> = {};
      if (body.subscription.plan !== undefined) {
        subUpdates.plan = body.subscription.plan;
        // 플랜에 따른 월간 한도 설정
        const planLimits: Record<string, number> = {
          free: 10,
          light: 50,
          standard: 150,
          pro: 500,
          unlimited: 999999,
        };
        subUpdates.monthly_limit = planLimits[body.subscription.plan] || 10;
      }
      if (body.subscription.status !== undefined) subUpdates.status = body.subscription.status;
      if (body.subscription.usageCount !== undefined) subUpdates.usage_count = body.subscription.usageCount;

      if (Object.keys(subUpdates).length > 0) {
        subUpdates.updated_at = new Date().toISOString();

        // 구독이 있으면 업데이트, 없으면 생성
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingSub) {
          const { error } = await supabase
            .from('subscriptions')
            .update(subUpdates)
            .eq('user_id', userId);

          if (error) {
            console.error('Subscription update error:', error);
            return NextResponse.json({ error: '구독 정보 수정에 실패했습니다.' }, { status: 500 });
          }
        } else {
          // 새 구독 생성
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          const planLimits: Record<string, number> = {
            free: 10,
            light: 50,
            standard: 150,
            pro: 500,
            unlimited: 999999,
          };
          const newPlan = body.subscription.plan || 'free';
          const newLimit = planLimits[newPlan] || 10;

          const { error } = await supabase.from('subscriptions').insert({
            user_id: userId,
            plan: newPlan,
            status: body.subscription.status || 'active',
            usage_count: body.subscription.usageCount || 0,
            monthly_limit: newLimit,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          });

          if (error) {
            console.error('Subscription create error:', error);
            return NextResponse.json({ error: '구독 생성에 실패했습니다.' }, { status: 500 });
          }
        }
        updates.subscription = subUpdates;
      }
    }

    // 블로그 활성화/비활성화
    if (body.blog) {
      const { blogId, isActive } = body.blog;
      if (blogId && isActive !== undefined) {
        const { error } = await supabase
          .from('blogs')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', blogId)
          .eq('user_id', userId);

        if (error) {
          console.error('Blog update error:', error);
          return NextResponse.json({ error: '블로그 정보 수정에 실패했습니다.' }, { status: 500 });
        }
        updates.blog = { blogId, isActive };
      }
    }

    // 사용자 설정 수정 (자동 생성 설정)
    if (body.settings) {
      const settingsUpdates: Record<string, unknown> = {};
      if (body.settings.isEnabled !== undefined) settingsUpdates.is_enabled = body.settings.isEnabled;
      if (body.settings.preferredProvider !== undefined) settingsUpdates.preferred_provider = body.settings.preferredProvider;
      if (body.settings.preferredCategories !== undefined) settingsUpdates.preferred_categories = body.settings.preferredCategories;
      if (body.settings.postsPerDay !== undefined) settingsUpdates.posts_per_day = body.settings.postsPerDay;

      if (Object.keys(settingsUpdates).length > 0) {
        settingsUpdates.updated_at = new Date().toISOString();

        const { data: existingSettings } = await supabase
          .from('auto_generate_settings')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingSettings) {
          const { error } = await supabase
            .from('auto_generate_settings')
            .update(settingsUpdates)
            .eq('user_id', userId);

          if (error) {
            console.error('Settings update error:', error);
            return NextResponse.json({ error: '설정 수정에 실패했습니다.' }, { status: 500 });
          }
        }
        updates.settings = settingsUpdates;
      }
    }

    return NextResponse.json({
      success: true,
      updates,
      message: '사용자 정보가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: '사용자 정보 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 사용자 삭제 (소프트 삭제 또는 하드 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const supabase = createAdminClient();

    if (hardDelete) {
      // 하드 삭제 - 모든 관련 데이터 삭제
      // 순서가 중요: FK 제약 조건 고려
      await supabase.from('posts').delete().eq('user_id', userId);
      await supabase.from('blogs').delete().eq('user_id', userId);
      await supabase.from('api_keys').delete().eq('user_id', userId);
      await supabase.from('payment_history').delete().eq('user_id', userId);
      await supabase.from('subscriptions').delete().eq('user_id', userId);
      await supabase.from('auto_generate_settings').delete().eq('user_id', userId);
      await supabase.from('notification_settings').delete().eq('user_id', userId);

      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) {
        console.error('User delete error:', error);
        return NextResponse.json({ error: '사용자 삭제에 실패했습니다.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '사용자가 완전히 삭제되었습니다.',
      });
    } else {
      // 소프트 삭제 - 구독 비활성화만
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error('Subscription cancel error:', error);
        return NextResponse.json({ error: '구독 취소에 실패했습니다.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '사용자 구독이 취소되었습니다.',
      });
    }
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: '사용자 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
