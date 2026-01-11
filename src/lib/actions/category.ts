'use server';

import { createClient } from '@/lib/supabase/server';
import { areValidCategoryIds } from '@/lib/constants/categories';

interface SaveCategoriesParams {
  blogId: string;
  categories: string[];
}

interface CategoryResult {
  success: boolean;
  categories?: string[];
  error?: string;
}

export async function saveUserCategories(params: SaveCategoriesParams): Promise<CategoryResult> {
  const { blogId, categories } = params;

  // Validate categories count
  if (!categories || categories.length === 0) {
    return { success: false, error: '최소 1개 이상의 카테고리를 선택해주세요.' };
  }

  if (categories.length > 5) {
    return { success: false, error: '최대 5개까지 카테고리를 선택할 수 있습니다.' };
  }

  // Validate category IDs
  if (!areValidCategoryIds(categories)) {
    return { success: false, error: '유효하지 않은 카테고리가 포함되어 있습니다.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // Verify blog exists and belongs to user
    const { data: blog, error: selectError } = await supabase
      .from('blogs')
      .select('id, user_id')
      .eq('id', blogId)
      .single();

    if (selectError || !blog || blog.user_id !== user.id) {
      return { success: false, error: '블로그를 찾을 수 없습니다.' };
    }

    // Update blog categories
    const { data: updatedBlog, error: updateError } = await supabase
      .from('blogs')
      .update({ categories })
      .eq('id', blogId)
      .eq('user_id', user.id)
      .select('categories')
      .single();

    if (updateError || !updatedBlog) {
      console.error('Update categories error:', updateError);
      return { success: false, error: '카테고리 저장에 실패했습니다.' };
    }

    return {
      success: true,
      categories: updatedBlog.categories,
    };
  } catch (error) {
    console.error('Save categories error:', error);
    return { success: false, error: '카테고리 저장 중 오류가 발생했습니다.' };
  }
}

export async function getUserCategories(blogId: string): Promise<CategoryResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: blog, error: selectError } = await supabase
      .from('blogs')
      .select('categories')
      .eq('id', blogId)
      .eq('user_id', user.id)
      .single();

    if (selectError || !blog) {
      return { success: false, error: '블로그를 찾을 수 없습니다.' };
    }

    return {
      success: true,
      categories: blog.categories || [],
    };
  } catch (error) {
    console.error('Get categories error:', error);
    return { success: false, error: '카테고리 조회 중 오류가 발생했습니다.' };
  }
}
