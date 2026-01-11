'use server';

import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import {
  AIProvider,
  ContentGenerationParams,
  ContentGenerationResult,
  ImageGenerationParams,
  ImageGenerationResult,
  AIGeneratorConfig,
} from './types';
import { generateContentWithOpenAI, generateImageWithOpenAI } from './openai';
import { generateContentWithClaude } from './claude';
import { generateContentWithGemini, generateImageWithGemini } from './gemini';

// Re-export types
export * from './types';

/**
 * 사용자의 API 키 가져오기
 */
async function getUserApiKey(provider: AIProvider): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('encrypted_key, is_valid')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('is_valid', true)
      .single();

    if (!apiKey) {
      return null;
    }

    return decrypt(apiKey.encrypted_key);
  } catch {
    return null;
  }
}

/**
 * 통합 콘텐츠 생성 함수
 */
export async function generateContent(
  params: ContentGenerationParams,
  provider: AIProvider,
  customConfig?: Partial<AIGeneratorConfig>
): Promise<ContentGenerationResult> {
  // API 키 가져오기
  const apiKey = customConfig?.apiKey || (await getUserApiKey(provider));

  if (!apiKey) {
    return {
      success: false,
      error: `${provider.toUpperCase()} API 키가 등록되지 않았거나 유효하지 않습니다.`,
      provider,
      generatedAt: new Date().toISOString(),
    };
  }

  const config: AIGeneratorConfig = {
    apiKey,
    ...customConfig,
  };

  switch (provider) {
    case 'openai':
      return generateContentWithOpenAI(params, config);
    case 'claude':
      return generateContentWithClaude(params, config);
    case 'gemini':
      return generateContentWithGemini(params, config);
    case 'grok':
      // Grok은 xAI API를 사용하며, OpenAI 호환 API 형식
      return generateContentWithGrok(params, config);
    default:
      return {
        success: false,
        error: `지원하지 않는 AI 제공자입니다: ${provider}`,
        provider,
        generatedAt: new Date().toISOString(),
      };
  }
}

/**
 * Grok을 사용한 블로그 콘텐츠 생성 (xAI API - OpenAI 호환)
 */
async function generateContentWithGrok(
  params: ContentGenerationParams,
  config: AIGeneratorConfig
): Promise<ContentGenerationResult> {
  const startTime = Date.now();
  const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
  const DEFAULT_MODEL = 'grok-beta';

  try {
    const { apiKey, model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 4096 } = config;

    if (!apiKey) {
      return {
        success: false,
        error: 'Grok API 키가 필요합니다.',
        provider: 'grok',
        generatedAt: new Date().toISOString(),
      };
    }

    const prompt = buildPromptForGrok(params);

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              '당신은 SEO에 최적화된 고품질 블로그 콘텐츠를 작성하는 전문 작가입니다. 항상 JSON 형식으로 응답합니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `Grok API 오류: ${response.status}`,
        provider: 'grok',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: '콘텐츠 생성 결과가 없습니다.',
        provider: 'grok',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    const parsedContent = parseGrokResponse(content);

    if (!parsedContent) {
      return {
        success: false,
        error: '콘텐츠 파싱에 실패했습니다.',
        provider: 'grok',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    const minLength = params.minLength || 1500;
    if (parsedContent.wordCount < minLength) {
      return {
        success: false,
        error: `콘텐츠가 최소 길이(${minLength}자)를 충족하지 않습니다.`,
        provider: 'grok',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: parsedContent,
      provider: 'grok',
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Grok content generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.',
      provider: 'grok',
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  }
}

function buildPromptForGrok(params: ContentGenerationParams): string {
  const { keyword, category = '일반', tone = 'professional', minLength = 1500, language = 'ko' } = params;

  const toneMap = {
    professional: '전문적이고 신뢰감 있는',
    casual: '편안하고 친근한',
    friendly: '따뜻하고 친절한',
    formal: '격식 있고 공식적인',
  };

  const languageMap = {
    ko: '한국어',
    en: 'English',
  };

  return `
당신은 블로그 콘텐츠 전문 작가입니다. 주어진 키워드를 바탕으로 SEO에 최적화된 고품질 블로그 포스트를 작성해주세요.

## 요구사항
- 키워드: ${keyword}
- 카테고리: ${category}
- 톤: ${toneMap[tone]}
- 최소 글자 수: ${minLength}자
- 언어: ${languageMap[language]}

## 작성 지침
1. 제목은 SEO에 최적화되고 클릭을 유도할 수 있도록 작성
2. 본문은 명확한 서론, 본론, 결론 구조로 작성
3. 적절한 소제목(H2, H3)을 사용하여 가독성 향상
4. 핵심 키워드를 자연스럽게 본문에 포함
5. 독자에게 실질적인 가치를 제공하는 정보 포함
6. 마크다운 형식으로 작성

## 출력 형식
다음 JSON 형식으로 응답해주세요:
{
  "title": "블로그 제목",
  "content": "마크다운 형식의 본문",
  "summary": "2-3문장의 요약",
  "tags": ["태그1", "태그2", "태그3"]
}
`;
}

function parseGrokResponse(responseText: string): {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  wordCount: number;
} | null {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.title || !parsed.content) {
      return null;
    }

    return {
      title: parsed.title,
      content: parsed.content,
      summary: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      wordCount: parsed.content.length,
    };
  } catch {
    return null;
  }
}

/**
 * 통합 이미지 생성 함수
 */
export async function generateImage(
  params: ImageGenerationParams,
  provider: AIProvider = 'openai',
  customConfig?: Partial<AIGeneratorConfig>
): Promise<ImageGenerationResult> {
  // API 키 가져오기 (이미지 생성은 주로 OpenAI 사용)
  const apiKey = customConfig?.apiKey || (await getUserApiKey(provider));

  if (!apiKey) {
    return {
      success: false,
      error: `${provider.toUpperCase()} API 키가 등록되지 않았거나 유효하지 않습니다.`,
      provider,
      generatedAt: new Date().toISOString(),
    };
  }

  const config: AIGeneratorConfig = {
    apiKey,
    ...customConfig,
  };

  switch (provider) {
    case 'openai':
      return generateImageWithOpenAI(params, config);
    case 'gemini':
      return generateImageWithGemini(params, config);
    default:
      return {
        success: false,
        error: `${provider}는 이미지 생성을 지원하지 않습니다.`,
        provider,
        generatedAt: new Date().toISOString(),
      };
  }
}

/**
 * 사용 가능한 AI 제공자 목록 조회
 */
export async function getAvailableProviders(): Promise<{
  success: boolean;
  providers?: AIProvider[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: keys } = await supabase
      .from('api_keys')
      .select('provider')
      .eq('user_id', user.id)
      .eq('is_valid', true);

    const providers = (keys || []).map((k) => k.provider as AIProvider);

    return { success: true, providers };
  } catch (error) {
    console.error('Get available providers error:', error);
    return { success: false, error: '제공자 목록을 가져오는 중 오류가 발생했습니다.' };
  }
}

/**
 * 콘텐츠 생성 및 저장 (Post 생성)
 */
export async function generateAndSaveContent(
  params: ContentGenerationParams & { blogId: string; keywordId?: string },
  provider: AIProvider
): Promise<{
  success: boolean;
  postId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 콘텐츠 생성
    const result = await generateContent(params, provider);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || '콘텐츠 생성에 실패했습니다.' };
    }

    // Post 저장
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        blog_id: params.blogId,
        keyword_id: params.keywordId || null,
        title: result.data.title,
        content: result.data.content,
        status: 'generated',
      })
      .select('id')
      .single();

    if (insertError || !post) {
      console.error('Save post error:', insertError);
      return { success: false, error: '콘텐츠 저장에 실패했습니다.' };
    }

    return { success: true, postId: post.id };
  } catch (error) {
    console.error('Generate and save content error:', error);
    return { success: false, error: '콘텐츠 생성 및 저장 중 오류가 발생했습니다.' };
  }
}
