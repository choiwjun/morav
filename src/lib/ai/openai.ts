'use server';

import {
  ContentGenerationParams,
  ContentGenerationResult,
  GeneratedContent,
  ImageGenerationParams,
  ImageGenerationResult,
  AIGeneratorConfig,
  CONTENT_PROMPT_TEMPLATE,
  MIN_CONTENT_LENGTH,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from './types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_IMAGE_API_URL = 'https://api.openai.com/v1/images/generations';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_IMAGE_MODEL = 'dall-e-3';

/**
 * 프롬프트 템플릿에 파라미터 적용
 */
function buildPrompt(params: ContentGenerationParams): string {
  const {
    keyword,
    category = '일반',
    tone = 'professional',
    minLength = MIN_CONTENT_LENGTH,
    language = 'ko',
  } = params;

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

  return CONTENT_PROMPT_TEMPLATE.replace('{{keyword}}', keyword)
    .replace('{{category}}', category)
    .replace('{{tone}}', toneMap[tone])
    .replace('{{minLength}}', minLength.toString())
    .replace('{{language}}', languageMap[language]);
}

/**
 * OpenAI API 응답 파싱
 */
function parseContentResponse(responseText: string): GeneratedContent | null {
  try {
    // JSON 블록 추출 시도
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
 * OpenAI를 사용한 블로그 콘텐츠 생성
 */
export async function generateContentWithOpenAI(
  params: ContentGenerationParams,
  config: AIGeneratorConfig
): Promise<ContentGenerationResult> {
  const startTime = Date.now();

  try {
    const { apiKey, model = DEFAULT_MODEL, temperature = DEFAULT_TEMPERATURE, maxTokens = DEFAULT_MAX_TOKENS } = config;

    if (!apiKey) {
      return {
        success: false,
        error: 'OpenAI API 키가 필요합니다.',
        provider: 'openai',
        generatedAt: new Date().toISOString(),
      };
    }

    const prompt = buildPrompt(params);

    const response = await fetch(OPENAI_API_URL, {
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
        error: errorData.error?.message || `OpenAI API 오류: ${response.status}`,
        provider: 'openai',
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
        provider: 'openai',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    const parsedContent = parseContentResponse(content);

    if (!parsedContent) {
      return {
        success: false,
        error: '콘텐츠 파싱에 실패했습니다.',
        provider: 'openai',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    // 최소 글자 수 검증
    if (parsedContent.wordCount < (params.minLength || MIN_CONTENT_LENGTH)) {
      return {
        success: false,
        error: `콘텐츠가 최소 길이(${params.minLength || MIN_CONTENT_LENGTH}자)를 충족하지 않습니다.`,
        provider: 'openai',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: parsedContent,
      provider: 'openai',
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('OpenAI content generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.',
      provider: 'openai',
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * OpenAI DALL-E를 사용한 이미지 생성
 */
export async function generateImageWithOpenAI(
  params: ImageGenerationParams,
  config: AIGeneratorConfig
): Promise<ImageGenerationResult> {
  try {
    const { apiKey } = config;
    const { prompt, style = 'realistic', size = '1024x1024' } = params;

    if (!apiKey) {
      return {
        success: false,
        error: 'OpenAI API 키가 필요합니다.',
        provider: 'openai',
        generatedAt: new Date().toISOString(),
      };
    }

    const stylePrompt = {
      realistic: 'photorealistic, high quality, detailed',
      cartoon: 'cartoon style, vibrant colors, playful',
      artistic: 'artistic, creative, expressive',
      minimalist: 'minimalist, clean, simple',
    };

    const enhancedPrompt = `${prompt}. Style: ${stylePrompt[style]}`;

    const response = await fetch(OPENAI_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_IMAGE_MODEL,
        prompt: enhancedPrompt,
        n: 1,
        size,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `이미지 생성 API 오류: ${response.status}`,
        provider: 'openai',
        generatedAt: new Date().toISOString(),
      };
    }

    const data = await response.json();
    const imageData = data.data?.[0];

    if (!imageData?.url) {
      return {
        success: false,
        error: '이미지 생성 결과가 없습니다.',
        provider: 'openai',
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      image: {
        url: imageData.url,
        revisedPrompt: imageData.revised_prompt,
      },
      provider: 'openai',
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.',
      provider: 'openai',
      generatedAt: new Date().toISOString(),
    };
  }
}
