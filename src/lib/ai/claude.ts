'use server';

import {
  ContentGenerationParams,
  ContentGenerationResult,
  GeneratedContent,
  AIGeneratorConfig,
  CONTENT_PROMPT_TEMPLATE,
  MIN_CONTENT_LENGTH,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from './types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const ANTHROPIC_VERSION = '2023-06-01';

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
 * Claude API 응답 파싱
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
 * Claude를 사용한 블로그 콘텐츠 생성
 */
export async function generateContentWithClaude(
  params: ContentGenerationParams,
  config: AIGeneratorConfig
): Promise<ContentGenerationResult> {
  const startTime = Date.now();

  try {
    const { apiKey, model = DEFAULT_MODEL, temperature = DEFAULT_TEMPERATURE, maxTokens = DEFAULT_MAX_TOKENS } = config;

    if (!apiKey) {
      return {
        success: false,
        error: 'Claude API 키가 필요합니다.',
        provider: 'claude',
        generatedAt: new Date().toISOString(),
      };
    }

    const prompt = buildPrompt(params);

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system:
          '당신은 SEO에 최적화된 고품질 블로그 콘텐츠를 작성하는 전문 작가입니다. 항상 JSON 형식으로 응답합니다.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `Claude API 오류: ${response.status}`,
        provider: 'claude',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return {
        success: false,
        error: '콘텐츠 생성 결과가 없습니다.',
        provider: 'claude',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    const parsedContent = parseContentResponse(content);

    if (!parsedContent) {
      return {
        success: false,
        error: '콘텐츠 파싱에 실패했습니다.',
        provider: 'claude',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    // 최소 글자 수 검증
    if (parsedContent.wordCount < (params.minLength || MIN_CONTENT_LENGTH)) {
      return {
        success: false,
        error: `콘텐츠가 최소 길이(${params.minLength || MIN_CONTENT_LENGTH}자)를 충족하지 않습니다.`,
        provider: 'claude',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: parsedContent,
      provider: 'claude',
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Claude content generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.',
      provider: 'claude',
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    };
  }
}
