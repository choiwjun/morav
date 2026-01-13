import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContentWithImages, getAvailableProviders } from '@/lib/ai';
import type { AIProvider, ContentGenerationParams } from '@/lib/ai/types';

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
    const { keyword, category, tone, language, provider: requestedProvider } = body;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '키워드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용 가능한 AI 제공자 확인
    const providersResult = await getAvailableProviders();

    if (!providersResult.success || !providersResult.providers?.length) {
      return NextResponse.json(
        { success: false, error: 'AI API 키가 등록되어 있지 않습니다. 설정에서 API 키를 등록해주세요.' },
        { status: 400 }
      );
    }

    // 요청된 제공자가 있으면 사용, 없으면 첫 번째 사용 가능한 제공자 사용
    let provider: AIProvider;
    if (requestedProvider && providersResult.providers.includes(requestedProvider)) {
      provider = requestedProvider;
    } else {
      // 우선순위: claude > openai > gemini > grok
      const priorityOrder: AIProvider[] = ['claude', 'openai', 'gemini', 'grok'];
      provider = priorityOrder.find(p => providersResult.providers!.includes(p)) || providersResult.providers[0];
    }

    // 콘텐츠 생성 파라미터
    const params: ContentGenerationParams = {
      keyword: keyword.trim(),
      category: category || undefined,
      tone: tone || 'professional',
      language: language || 'ko',
      minLength: 1500,
      maxLength: 5000,
    };

    // AI 콘텐츠 + 이미지 생성
    const result = await generateContentWithImages(params, provider);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'AI 콘텐츠 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
      processingTime: result.processingTime,
      imageStats: result.imageStats,
    });
  } catch (error) {
    console.error('AI Generate API error:', error);
    return NextResponse.json(
      { success: false, error: 'AI 콘텐츠 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
