import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ blogId: string }>;
}

/**
 * GET /api/blogs/[blogId]
 * 블로그 상세 정보 조회
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { blogId } = await params;
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

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id, platform, blog_name, blog_url, categories, is_active, created_at, updated_at')
      .eq('id', blogId)
      .eq('user_id', user.id)
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: '블로그를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (error) {
      console.error('Get blog error:', error);
      return NextResponse.json(
        { success: false, error: '블로그 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: blog.id,
        platform: blog.platform,
        platformName: getPlatformName(blog.platform),
        name: blog.blog_name,
        url: blog.blog_url,
        categories: blog.categories || [],
        isActive: blog.is_active,
        createdAt: blog.created_at,
        updatedAt: blog.updated_at,
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

/**
 * PATCH /api/blogs/[blogId]
 * 블로그 정보 업데이트 (카테고리, 활성화 상태 등)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { blogId } = await params;
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
    const { categories, isActive } = body;

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        return NextResponse.json(
          { success: false, error: '카테고리는 배열이어야 합니다.' },
          { status: 400 }
        );
      }
      updateData.categories = categories;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { success: false, error: '활성화 상태는 불리언이어야 합니다.' },
          { status: 400 }
        );
      }
      updateData.is_active = isActive;
    }

    // 블로그 존재 확인 및 소유권 검증
    const { data: existingBlog, error: checkError } = await supabase
      .from('blogs')
      .select('id')
      .eq('id', blogId)
      .eq('user_id', user.id)
      .single();

    if (checkError?.code === 'PGRST116' || !existingBlog) {
      return NextResponse.json(
        { success: false, error: '블로그를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트 실행
    const { data: updatedBlog, error: updateError } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', blogId)
      .eq('user_id', user.id)
      .select('id, platform, blog_name, blog_url, categories, is_active, updated_at')
      .single();

    if (updateError) {
      console.error('Update blog error:', updateError);
      return NextResponse.json(
        { success: false, error: '블로그 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '블로그가 업데이트되었습니다.',
      blog: {
        id: updatedBlog.id,
        platform: updatedBlog.platform,
        name: updatedBlog.blog_name,
        url: updatedBlog.blog_url,
        categories: updatedBlog.categories || [],
        isActive: updatedBlog.is_active,
        updatedAt: updatedBlog.updated_at,
      },
    });
  } catch (error) {
    console.error('Update blog error:', error);
    return NextResponse.json(
      { success: false, error: '블로그 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blogs/[blogId]
 * 블로그 삭제 (연결 해제)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { blogId } = await params;
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

    // 블로그 존재 확인 및 소유권 검증
    const { data: existingBlog, error: checkError } = await supabase
      .from('blogs')
      .select('id, blog_name')
      .eq('id', blogId)
      .eq('user_id', user.id)
      .single();

    if (checkError?.code === 'PGRST116' || !existingBlog) {
      return NextResponse.json(
        { success: false, error: '블로그를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제 실행
    const { error: deleteError } = await supabase
      .from('blogs')
      .delete()
      .eq('id', blogId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete blog error:', deleteError);
      return NextResponse.json(
        { success: false, error: '블로그 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${existingBlog.blog_name} 블로그가 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json(
      { success: false, error: '블로그 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function getPlatformName(platform: string): string {
  switch (platform) {
    case 'tistory':
      return '티스토리';
    case 'blogger':
      return '구글 블로거';
    case 'wordpress':
      return '워드프레스';
    default:
      return platform;
  }
}
