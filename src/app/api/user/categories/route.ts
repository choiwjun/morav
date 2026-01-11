import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { areValidCategoryIds } from '@/lib/constants/categories';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories, blogId } = body;

    // Validate categories
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: '카테고리를 선택해주세요.' },
        { status: 400 }
      );
    }

    if (categories.length === 0) {
      return NextResponse.json(
        { error: '최소 1개 이상의 카테고리를 선택해주세요.' },
        { status: 400 }
      );
    }

    if (categories.length > 5) {
      return NextResponse.json(
        { error: '최대 5개까지 카테고리를 선택할 수 있습니다.' },
        { status: 400 }
      );
    }

    if (!areValidCategoryIds(categories)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리가 포함되어 있습니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // If blogId is provided, update that specific blog
    // Otherwise, update all user's blogs
    if (blogId) {
      const { data: blog, error: updateError } = await supabase
        .from('blogs')
        .update({ categories })
        .eq('id', blogId)
        .eq('user_id', user.id)
        .select('id, categories')
        .single();

      if (updateError || !blog) {
        console.error('Update categories error:', updateError);
        return NextResponse.json(
          { error: '카테고리 저장에 실패했습니다.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        blogId: blog.id,
        categories: blog.categories,
      });
    } else {
      // 먼저 사용자의 블로그가 있는지 확인
      const { data: existingBlogs, error: checkError } = await supabase
        .from('blogs')
        .select('id')
        .eq('user_id', user.id);

      if (checkError) {
        console.error('Check blogs error:', checkError);
        return NextResponse.json(
          { error: '블로그 확인에 실패했습니다.' },
          { status: 400 }
        );
      }

      if (!existingBlogs || existingBlogs.length === 0) {
        return NextResponse.json(
          { error: '먼저 블로그를 연결해주세요.' },
          { status: 400 }
        );
      }

      // Update all user's blogs with the same categories
      const { data: blogs, error: updateError } = await supabase
        .from('blogs')
        .update({ categories })
        .eq('user_id', user.id)
        .select('id, categories');

      if (updateError) {
        console.error('Update categories error:', updateError);
        return NextResponse.json(
          { error: '카테고리 저장에 실패했습니다.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        blogs: blogs || [],
        categories,
      });
    }
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: '카테고리 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Get all user's blogs with their categories
    const { data: blogs, error: selectError } = await supabase
      .from('blogs')
      .select('id, blog_name, categories')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (selectError) {
      console.error('Get categories error:', selectError);
      return NextResponse.json(
        { error: '카테고리 조회에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      blogs: blogs || [],
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: '카테고리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
