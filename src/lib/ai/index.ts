'use server';

import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import type {
  AIProvider,
  ContentGenerationParams,
  ContentGenerationResult,
  ImageGenerationParams,
  ImageGenerationResult,
  AIGeneratorConfig,
  GeneratedContent,
  ImagePrompt,
} from './types';
import { generateContentWithOpenAI, generateImageWithOpenAI } from './openai';
import { generateContentWithClaude } from './claude';
import { generateContentWithGemini, generateImageWithGemini } from './gemini';

// Re-export types using export type for 'use server' compatibility
export type { AIProvider, ContentGenerationParams, ContentGenerationResult, ImageGenerationParams, ImageGenerationResult, AIGeneratorConfig } from './types';

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
              '당신은 구글 애드센스 승인 기준을 완벽히 충족하는 고품질 블로그 콘텐츠를 작성하는 전문 SEO 라이터입니다. HTML 형식으로 작성하며 항상 JSON 형식으로 응답합니다. 이미지 프롬프트를 포함하여 시각적으로 풍부한 콘텐츠를 생성합니다.',
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
  const { keyword, category = '일반', tone = 'professional', minLength = 5000, language = 'ko', imageStyle = 'photo' } = params;

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

  const imageStyleMap = {
    photo: '사진',
    illustration: '일러스트',
    infographic: '인포그래픽',
    minimal: '미니멀',
  };

  return `
당신은 구글 애드센스 승인 기준을 완벽히 충족하는 고품질 블로그 콘텐츠를 작성하는 전문 SEO 라이터입니다.

## 입력 변수
- keyword: ${keyword} (타겟 키워드)
- category: ${category} (블로그 카테고리)
- tone: ${toneMap[tone]} (친근함/전문적/유머러스/정보전달)
- minLength: ${minLength} (최소 글자 수, 권장 2000-3000자)
- language: ${languageMap[language]} (ko/en/ja)
- imageStyle: ${imageStyleMap[imageStyle]} (사진/일러스트/인포그래픽/미니멀)

## 핵심 미션
독자에게 실질적 가치를 제공하고, 검색 의도를 완벽히 충족하며, 자연스럽고 신뢰할 수 있는 콘텐츠를 작성하세요.

## 콘텐츠 구조
1. 제목 - <h1> 태그, SEO 최적화된 60자 이내 제목
2. 대표 이미지 - 글 도입부에 배치, [IMAGE_PROMPT] 태그로 명시
3. 도입부 - <p> 태그로 2-3개 단락, 첫 100단어 내 키워드 포함
4. 본문 - <h2> 주요 섹션 5-8개, 각 섹션마다 이미지 삽입
5. 결론 - <p> 태그로 2-3개 단락, 키워드 재언급

## 이미지 생성 가이드
- 총 이미지 수 5-8개 (대표 이미지 포함)
- 각 <h2> 섹션마다 관련 이미지 1개씩 삽입
- 이미지 HTML 형식:
<div class="article-image">
  <img src="image-placeholder-[번호].jpg" alt="[키워드 포함 30-50자 설명]" />
  <p class="caption">[이미지 설명]</p>
</div>

## 출력 형식
다음 JSON 형식으로 응답해주세요:
{
  "title": "SEO 최적화된 블로그 제목 (60자 이내)",
  "content": "순수 HTML 본문 (h1 제목 포함, 이미지 placeholder 포함)",
  "summary": "2-3문장의 요약",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "imagePrompts": [
    {
      "section": "섹션명",
      "prompt": "이미지 생성용 영문 프롬프트",
      "alt": "SEO 최적화된 한글 alt 텍스트"
    }
  ]
}

## 절대 금지 사항
1. 마크다운 문법 사용 금지
2. 코드블록 표시 금지
3. AI 티 나는 표현 금지 ("~에 대해 알아보겠습니다" 등)
4. 콜론(:) 사용 금지
5. 이미지 없는 긴 텍스트 블록 (300자 이상) 금지
`;
}

function parseGrokResponse(responseText: string): GeneratedContent | null {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.title || !parsed.content) {
      return null;
    }

    // imagePrompts 파싱
    const imagePrompts: ImagePrompt[] = Array.isArray(parsed.imagePrompts)
      ? parsed.imagePrompts.map((ip: { section?: string; prompt?: string; alt?: string }) => ({
          section: ip.section || '',
          prompt: ip.prompt || '',
          alt: ip.alt || '',
        }))
      : [];

    return {
      title: parsed.title,
      content: parsed.content,
      summary: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      wordCount: parsed.content.length,
      imagePrompts,
    };
  } catch {
    return null;
  }
}

/**
 * 콘텐츠 내 이미지 placeholder를 실제 이미지로 교체
 */
export async function generateImagesAndReplacePlaceholders(
  content: string,
  imagePrompts: ImagePrompt[],
  provider: AIProvider,
  customConfig?: Partial<AIGeneratorConfig>
): Promise<{
  success: boolean;
  content: string;
  generatedImages: number;
  failedImages: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updatedContent = content;
  let generatedImages = 0;
  let failedImages = 0;

  // 이미지 생성을 지원하는 프로바이더 확인 (openai 또는 gemini)
  // 다른 프로바이더 사용 시 openai로 폴백하되, API 키가 있는지 확인
  let imageProvider: AIProvider = provider;
  if (provider !== 'openai' && provider !== 'gemini') {
    // openai 또는 gemini API 키가 있는지 확인
    const openaiKey = await getUserApiKey('openai');
    const geminiKey = await getUserApiKey('gemini');

    if (openaiKey) {
      imageProvider = 'openai';
    } else if (geminiKey) {
      imageProvider = 'gemini';
    } else {
      // 이미지 생성 가능한 API 키가 없음
      return {
        success: false,
        content,
        generatedImages: 0,
        failedImages: imagePrompts.length,
        errors: ['이미지 생성을 위한 OpenAI 또는 Gemini API 키가 필요합니다.'],
      };
    }
  }

  console.log(`=== Image Generation Debug ===`);
  console.log(`Provider: ${provider}, Image Provider: ${imageProvider}`);
  console.log(`Image Prompts count: ${imagePrompts.length}`);

  for (let i = 0; i < imagePrompts.length; i++) {
    const imagePrompt = imagePrompts[i];

    // placeholder 패턴들 (1부터 시작, 0부터 시작, 대소문자 변형 등)
    const placeholder1 = `image-placeholder-${i + 1}.jpg`;
    const placeholder0 = `image-placeholder-${i}.jpg`;

    // placeholder가 콘텐츠에 존재하는지 확인
    const hasPlaceholder1 = updatedContent.includes(placeholder1);
    const hasPlaceholder0 = updatedContent.includes(placeholder0);

    console.log(`Image ${i}: prompt="${imagePrompt.prompt?.substring(0, 50)}...", placeholder1=${hasPlaceholder1}, placeholder0=${hasPlaceholder0}`);

    if (!hasPlaceholder1 && !hasPlaceholder0) {
      console.log(`Skipping image ${i}: no placeholder found`);
      continue;
    }

    try {
      // 이미지 생성
      console.log(`Generating image ${i + 1} with ${imageProvider}...`);
      const imageResult = await generateImage(
        {
          prompt: imagePrompt.prompt,
          style: 'realistic',
          size: '1024x1024',
        },
        imageProvider,
        customConfig
      );

      console.log(`Image ${i + 1} result: success=${imageResult.success}, url=${imageResult.image?.url?.substring(0, 50)}...`);

      if (imageResult.success && imageResult.image?.url) {
        // placeholder를 실제 이미지 URL로 교체
        if (hasPlaceholder1) {
          updatedContent = updatedContent.split(placeholder1).join(imageResult.image.url);
        }
        if (hasPlaceholder0) {
          updatedContent = updatedContent.split(placeholder0).join(imageResult.image.url);
        }
        generatedImages++;
      } else {
        failedImages++;
        errors.push(`이미지 ${i + 1} 생성 실패: ${imageResult.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      failedImages++;
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error(`Image ${i + 1} generation error:`, errorMsg);
      errors.push(`이미지 ${i + 1} 생성 중 오류: ${errorMsg}`);
    }
  }

  console.log(`=== Image Generation Complete ===`);
  console.log(`Generated: ${generatedImages}, Failed: ${failedImages}`);

  return {
    success: failedImages === 0,
    content: updatedContent,
    generatedImages,
    failedImages,
    errors,
  };
}

/**
 * 콘텐츠 생성 + 이미지 생성 통합 함수
 */
export async function generateContentWithImages(
  params: ContentGenerationParams,
  provider: AIProvider,
  customConfig?: Partial<AIGeneratorConfig>
): Promise<ContentGenerationResult & {
  imageStats?: {
    generated: number;
    failed: number;
    errors: string[]
  }
}> {
  // 1. 콘텐츠 생성
  const contentResult = await generateContent(params, provider, customConfig);

  if (!contentResult.success || !contentResult.data) {
    return contentResult;
  }

  // 2. imagePrompts가 있으면 이미지 생성 및 placeholder 교체
  const imagePrompts = contentResult.data.imagePrompts || [];

  if (imagePrompts.length === 0) {
    return contentResult;
  }

  const imageResult = await generateImagesAndReplacePlaceholders(
    contentResult.data.content,
    imagePrompts,
    provider,
    customConfig
  );

  // 3. 결과 반환
  return {
    ...contentResult,
    data: {
      ...contentResult.data,
      content: imageResult.content,
    },
    imageStats: {
      generated: imageResult.generatedImages,
      failed: imageResult.failedImages,
      errors: imageResult.errors,
    },
  };
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
