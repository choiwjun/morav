'use server';

/**
 * AI 콘텐츠 생성 타입 정의
 */

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'grok';

export interface ContentGenerationParams {
  keyword: string;
  category?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
  minLength?: number;
  maxLength?: number;
  language?: 'ko' | 'en';
}

export interface GeneratedContent {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  wordCount: number;
}

export interface ContentGenerationResult {
  success: boolean;
  data?: GeneratedContent;
  error?: string;
  provider: AIProvider;
  generatedAt: string;
  processingTime?: number;
}

export interface ImageGenerationParams {
  prompt: string;
  style?: 'realistic' | 'cartoon' | 'artistic' | 'minimalist';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  image?: GeneratedImage;
  error?: string;
  provider: AIProvider;
  generatedAt: string;
}

export interface AIGeneratorConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// 기본 프롬프트 템플릿
export const CONTENT_PROMPT_TEMPLATE = `
당신은 블로그 콘텐츠 전문 작가입니다. 주어진 키워드를 바탕으로 SEO에 최적화된 고품질 블로그 포스트를 작성해주세요.

## 요구사항
- 키워드: {{keyword}}
- 카테고리: {{category}}
- 톤: {{tone}}
- 최소 글자 수: {{minLength}}자
- 언어: {{language}}

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

export const MIN_CONTENT_LENGTH = 1500;
export const MAX_CONTENT_LENGTH = 5000;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 4096;
