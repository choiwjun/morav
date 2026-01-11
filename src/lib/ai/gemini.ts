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
} from './types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-1.5-flash';
const IMAGE_MODEL = 'imagen-3.0-generate-002';

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

  const systemPrompt = '당신은 SEO에 최적화된 고품질 블로그 콘텐츠를 작성하는 전문 작가입니다. 항상 JSON 형식으로 응답합니다.\n\n';

  return systemPrompt + CONTENT_PROMPT_TEMPLATE.replace('{{keyword}}', keyword)
    .replace('{{category}}', category)
    .replace('{{tone}}', toneMap[tone])
    .replace('{{minLength}}', minLength.toString())
    .replace('{{language}}', languageMap[language]);
}

/**
 * Gemini API 응답 파싱
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
 * Gemini를 사용한 블로그 콘텐츠 생성
 */
export async function generateContentWithGemini(
  params: ContentGenerationParams,
  config: AIGeneratorConfig
): Promise<ContentGenerationResult> {
  const startTime = Date.now();

  try {
    const { apiKey, model = DEFAULT_MODEL, temperature = DEFAULT_TEMPERATURE } = config;

    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API 키가 필요합니다.',
        provider: 'gemini',
        generatedAt: new Date().toISOString(),
      };
    }

    const prompt = buildPrompt(params);
    const apiUrl = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 8192,
          responseMimeType: 'text/plain',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `Gemini API 오류: ${response.status}`,
        provider: 'gemini',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return {
        success: false,
        error: '콘텐츠 생성 결과가 없습니다.',
        provider: 'gemini',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    const parsedContent = parseContentResponse(content);

    if (!parsedContent) {
      return {
        success: false,
        error: '콘텐츠 파싱에 실패했습니다.',
        provider: 'gemini',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    // 최소 글자 수 검증
    if (parsedContent.wordCount < (params.minLength || MIN_CONTENT_LENGTH)) {
      return {
        success: false,
        error: `콘텐츠가 최소 길이(${params.minLength || MIN_CONTENT_LENGTH}자)를 충족하지 않습니다.`,
        provider: 'gemini',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: parsedContent,
      provider: 'gemini',
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Gemini content generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.',
      provider: 'gemini',
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Gemini Imagen을 사용한 이미지 생성
 */
export async function generateImageWithGemini(
  params: ImageGenerationParams,
  config: AIGeneratorConfig
): Promise<ImageGenerationResult> {
  try {
    const { apiKey } = config;
    const { prompt, style = 'realistic' } = params;

    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API 키가 필요합니다.',
        provider: 'gemini',
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
    const apiUrl = `${GEMINI_API_URL}/${IMAGE_MODEL}:generateImages?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        number_of_images: 1,
        aspect_ratio: '1:1',
        safety_filter_level: 'block_some',
        person_generation: 'allow_adult',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `이미지 생성 API 오류: ${response.status}`,
        provider: 'gemini',
        generatedAt: new Date().toISOString(),
      };
    }

    const data = await response.json();
    const imageData = data.generated_images?.[0];

    if (!imageData) {
      return {
        success: false,
        error: '이미지 생성 결과가 없습니다.',
        provider: 'gemini',
        generatedAt: new Date().toISOString(),
      };
    }

    // Gemini Imagen은 base64 이미지를 반환
    const base64Image = imageData.image?.image_bytes;
    if (!base64Image) {
      return {
        success: false,
        error: '이미지 데이터가 없습니다.',
        provider: 'gemini',
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      image: {
        url: `data:image/png;base64,${base64Image}`,
      },
      provider: 'gemini',
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Gemini image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.',
      provider: 'gemini',
      generatedAt: new Date().toISOString(),
    };
  }
}
