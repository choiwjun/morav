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
당신은 구글 애드센스 심사 통과 기준에 맞는 고품질 블로그 콘텐츠를 작성하는 전문 작가입니다.

## 요구사항
- 키워드: {{keyword}}
- 카테고리: {{category}}
- 톤: {{tone}}
- 최소 글자 수: {{minLength}}자
- 언어: {{language}}

## 작성 지침

### 구조 및 형식
1. HTML 형식으로 작성 (마크다운 사용 금지)
2. 소개는 <p> 태그로 시작하며 부제목 없이 자연스럽게 시작
3. 주요 섹션에는 <h2>, 하위 섹션에는 <h3>, 그 하위에는 <h4> 태그 사용
4. 소제목(h2, h3, h4)은 최소 7개 이상 포함
5. 소제목에 섹션 번호를 포함하지 않음
6. 단락에는 <p> 태그, 목록에는 <ul>과 <li> 태그 사용
7. SEO 향상을 위해 중요 키워드에 <b>, <u> 태그 적절히 사용

### 콘텐츠 품질
1. 각 섹션별로 최소 5000자 이상의 상세하고 포괄적인 설명 작성
2. 실제 사람이 쓴 것처럼 자연스럽고 논리적인 흐름 유지
3. 자세한 스타일과 학술적인 어조 사용, 가끔 유머 포함
4. 독자에게 실질적인 가치를 제공하는 유익한 정보 포함
5. 명확한 도입부, 본문, 결론 구조로 논리적 진행

### SEO 최적화
1. 제목은 SEO에 최적화되고 클릭을 유도할 수 있도록 작성
2. 키워드를 서론에 3번, 결론에 3번 자연스럽게 포함
3. 키워드를 과도하게 반복하지 않고 자연스럽게 통합
4. 각 소제목 내용은 500자가 넘지 않도록 간결하게

### 금지 사항
1. 코드블록 표시 금지 (백틱, html 등)
2. 특수 기호 사용 금지 (*** 등)
3. 콜론(:) 사용 금지
4. 마크다운 문법 사용 금지

## 출력 형식
다음 JSON 형식으로 응답해주세요:
{
  "title": "SEO 최적화된 블로그 제목",
  "content": "HTML 형식의 본문 (<p>, <h2>, <h3>, <h4>, <ul>, <li>, <b>, <u> 태그 사용)",
  "summary": "2-3문장의 요약",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}
`;

export const MIN_CONTENT_LENGTH = 5000;
export const MAX_CONTENT_LENGTH = 15000;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 16384;
