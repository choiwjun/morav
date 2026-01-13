import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { disconnectBlog } from '@/lib/actions/blog';
import { encrypt } from '@/lib/crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 블로그 단일 조회
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !blog) {
      return NextResponse.json({ success: false, error: '블로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: blog.id,
        name: blog.blog_name,
        url: blog.blog_url,
        platform: blog.platform,
        categories: blog.categories || [],
        is_active: blog.is_active,
        created_at: blog.created_at,
      },
    });
  } catch (error) {
    console.error('Get blog error:', error);
    return NextResponse.json(
      { success: false, error: '블로그 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 블로그 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, categories, is_active, external_blog_id, access_token } = body;

    // 블로그 소유권 확인
    const { data: existingBlog, error: findError } = await supabase
      .from('blogs')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !existingBlog) {
      return NextResponse.json({ success: false, error: '블로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업데이트 데이터 준비
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof name === 'string' && name.trim()) {
      updateData.blog_name = name.trim();
    }

    if (Array.isArray(categories)) {
      updateData.categories = categories;
    }

    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active;
    }

    // Blog ID (Blogger용)
    if (typeof external_blog_id === 'string' && external_blog_id.trim()) {
      updateData.external_blog_id = external_blog_id.trim();
    }

    // Access Token / API Key 업데이트 (암호화)
    if (typeof access_token === 'string' && access_token.trim()) {
      updateData.access_token = encrypt(access_token.trim());
    }

    const { data: updatedBlog, error: updateError } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update blog error:', updateError);
      return NextResponse.json({ success: false, error: '블로그 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: updatedBlog.id,
        name: updatedBlog.blog_name,
        url: updatedBlog.blog_url,
        platform: updatedBlog.platform,
        categories: updatedBlog.categories || [],
        is_active: updatedBlog.is_active,
      },
    });
  } catch (error) {
    console.error('Update blog error:', error);
    return NextResponse.json(
      { success: false, error: '블로그 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
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