import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAndSaveContent, getAvailableProviders, AIProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

interface GenerateRequest {
  keyword: string;
  keywordId?: string;
  blogId: string;
  category?: string;
  provider?: AIProvider;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
}

/**
 * POST /api/generate
 * 키워드로 콘텐츠 생성 및 포스트 저장
 */
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

    const body: GenerateRequest = await request.json();
    const { keyword, keywordId, blogId, category, provider, tone } = body;

    if (!keyword || !blogId) {
      return NextResponse.json(
        { success: false, error: '키워드와 블로그 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 블로그 소유권 확인
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id')
      .eq('id', blogId)
      .eq('user_id', user.id)
      .single();

    if (blogError || !blog) {
      return NextResponse.json(
        { success: false, error: '블로그를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // AI 제공자 결정
    let selectedProvider: AIProvider = provider || 'openai';

    // 제공자가 지정되지 않은 경우 사용 가능한 첫 번째 제공자 사용
    if (!provider) {
      const providersResult = await getAvailableProviders();
      if (providersResult.success && providersResult.providers && providersResult.providers.length > 0) {
        selectedProvider = providersResult.providers[0];
      } else {
        return NextResponse.json(
          { success: false, error: 'AI API 키가 등록되지 않았습니다. 설정에서 API 키를 등록해주세요.' },
          { status: 400 }
        );
      }
    }

    // 콘텐츠 생성 및 저장
    const result = await generateAndSaveContent(
      {
        keyword,
        keywordId,
        blogId,
        category,
        tone: tone || 'professional',
        minLength: 1500,
        language: 'ko',
      },
      selectedProvider
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      message: '콘텐츠가 생성되어 발행 대기 상태로 저장되었습니다.',
    });
  } catch (error) {
    console.error('Generate content error:', error);
    return NextResponse.json(
      { success: false, error: '콘텐츠 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate/providers
 * 사용 가능한 AI 제공자 목록 조회
 */
export async function GET() {
  try {
    const result = await getAvailableProviders();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      providers: result.providers,
    });
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json(
      { success: false, error: '제공자 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
