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
  imageStyle?: 'photo' | 'illustration' | 'infographic' | 'minimal';
}

export interface ImagePrompt {
  section: string;
  prompt: string;
  alt: string;
}

export interface GeneratedContent {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  wordCount: number;
  imagePrompts?: ImagePrompt[];
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
당신은 구글 애드센스 승인 기준을 완벽히 충족하는 고품질 블로그 콘텐츠를 작성하는 전문 SEO 라이터입니다.

## 입력 변수
- keyword: {{keyword}} (타겟 키워드)
- category: {{category}} (블로그 카테고리)
- tone: {{tone}} (친근함/전문적/유머러스/정보전달)
- minLength: {{minLength}} (최소 글자 수, 권장 2000-3000자)
- language: {{language}} (ko/en/ja)
- imageStyle: {{imageStyle}} (사진/일러스트/인포그래픽/미니멀) - 선택사항

## 핵심 미션
독자에게 실질적 가치를 제공하고, 검색 의도를 완벽히 충족하며, 자연스럽고 신뢰할 수 있는 콘텐츠를 작성하세요.

## 콘텐츠 구조

### 1. 제목 (필수)
- <h1> 태그 사용
- SEO 최적화된 60자 이내 제목
- 키워드 자연스럽게 포함
- 클릭을 유도하는 매력적 구성

### 2. 대표 이미지 (필수)
- 글 도입부 바로 전 또는 직후에 배치
- 키워드와 글의 주제를 대표하는 이미지
- 고품질, 전문적, 시각적으로 매력적
- 이미지 생성 프롬프트를 [IMAGE_PROMPT] 태그로 명시

### 3. 도입부 (필수)
- <p> 태그로 2-3개 단락 작성
- 독자의 문제나 궁금증을 명확히 제시
- 이 글에서 얻을 수 있는 가치 암시
- 첫 100단어 내에 키워드 1회 포함

### 4. 본문 (필수)
- <h2> 주요 섹션 5-8개
- <h3> 하위 섹션 필요시 사용
- <h4> 세부 항목에만 제한적 사용
- 총 소제목 수: 최소 7개 이상
- 각 섹션: 300-800자 내외 (과도하게 길지 않게)
- 단락은 3-4문장 이내로 간결하게
- <ul>/<ol> 목록으로 핵심 정보 구조화
- 중요 키워드에 <b> 또는 <u> 적절히 사용
- **이미지는 도입부에 1개, 가장 중요한 섹션에 1-2개만 삽입 (총 2-3개)**

### 5. 결론 (필수)
- <p> 태그로 2-3개 단락
- 핵심 내용 간단히 요약
- 키워드 1-2회 자연스럽게 재언급
- 실행 가능한 제안이나 다음 단계 제시

## 이미지 삽입 가이드 (최소화 전략)

### 이미지 배치 전략 - 중요 섹션만
1. **대표 이미지 1개**: 글 시작 부분 (도입부 직후) - 필수
2. **핵심 섹션 이미지 1-2개**: 가장 중요한 h2 섹션에만 선택적으로 배치
3. **총 이미지 수**: 최대 2-3개 (발행 속도 최적화)
4. **이미지 없는 섹션이 대부분**: 텍스트 중심 콘텐츠로 구성

### 이미지 HTML 형식 (엄격히 준수)
<div class="article-image">
  <img src="image-placeholder-[번호].jpg" alt="[키워드 포함 상세 설명 30-50자]" />
  <p class="caption">[간단한 이미지 설명 또는 보충 정보]</p>
</div>

### 이미지 검색 키워드 작성 (웹 이미지 수집용)
각 이미지에 대해 Unsplash 등 무료 이미지 사이트에서 검색할 영문 키워드를 명시:
- 키워드는 간결하고 구체적으로 (예: "coffee shop interior", "business meeting", "technology laptop")
- 추상적인 개념보다 구체적인 사물/장면 위주

### 이미지 SEO 최적화
1. **alt 속성** (필수):
   - 키워드 자연스럽게 포함
   - 이미지 내용을 구체적으로 설명
   - 30-50자 길이
   - 예: "서울 강남구 인기 카페 인테리어 전경"

2. **파일명 규칙**:
   - 키워드-섹션명-번호.jpg 형식
   - 예: "seoul-gangnam-cafe-interior-01.jpg"
   - 공백 대신 하이픈(-) 사용

3. **캡션 활용**:
   - 이미지를 보충 설명하는 짧은 텍스트
   - 필요시 추가 정보나 출처 표시
   - 선택사항이지만 권장

### 이미지 컨셉 가이드라인

#### 대표 이미지 (필수)
- 글 전체 주제를 한눈에 표현하는 고품질 사진
- Unsplash 검색 키워드: 주제와 직접 관련된 구체적인 영문 키워드

#### 핵심 섹션 이미지 (선택적, 최대 1-2개)
- 글에서 가장 중요한 정보를 다루는 섹션에만 추가
- 나머지 섹션은 텍스트만으로 구성

### 이미지 품질 기준
1. **해상도**: 최소 1200px 이상 권장
2. **비율**: 16:9 또는 4:3 (블로그 표준)
3. **용량**: 적절히 최적화 (100-300KB)
4. **스타일 일관성**: 글 전체 이미지 톤앤매너 통일

### 저작권 및 안전 가이드
1. Unsplash/Pexels 등 무료 스톡 이미지 사용 (저작권 안전)
2. 상업적 사용 가능한 이미지만 사용
3. 상표권 침해 요소 제외
4. 애드센스 정책 위반 이미지 절대 금지

## 콘텐츠 품질 기준

### 독창성 & 가치
1. 100% 독창적인 내용 (복사/중복 절대 금지)
2. 독자에게 실질적 해결책이나 인사이트 제공
3. 최신 정보 및 트렌드 반영
4. 가능한 경우 데이터, 통계, 사례 포함

### 가독성 & 자연스러움
1. 실제 사람이 쓴 것처럼 자연스러운 문체
2. AI 티 나는 표현 지양:
   - "~에 대해 알아보겠습니다" 대신 직접 설명
   - "이 글에서는" 등 메타적 표현 최소화
3. {{tone}}에 맞는 일관된 어조 유지
4. 적절한 유머나 비유로 흥미 유발 (과하지 않게)

### 신뢰성 & 정확성
1. 검증 가능한 정보만 제공
2. 추측이나 과장 금지
3. 필요시 근거 명시 (단, 출처 링크는 최소화)
4. 최신성 유지 (발행 시점 기준 유효한 정보)

## SEO 최적화 전략

### 키워드 사용
1. 타겟 키워드를 글 전체에 자연스럽게 배치:
   - 제목(h1)에 1회
   - 도입부 첫 100단어 내 1회
   - 소제목(h2, h3)에 변형어로 2-3회
   - 본문 전체에 자연스럽게 5-7회
   - 이미지 alt 속성에 2-3회
   - 결론에 1-2회
2. 키워드 밀도: 1-2% 유지 (과도한 반복 금지)
3. LSI 키워드 (관련 검색어) 자연스럽게 포함

### 구조 최적화
1. 명확한 계층 구조 (h1 → h2 → h3 → h4)
2. 소제목에 숫자 제외 (SEO 친화적 제목)
3. 단락 길이: 3-4문장 (모바일 가독성)
4. 목록 적극 활용 (스캔 가능성 향상)
5. 이미지로 텍스트 밀도 완화

### 기술적 SEO
1. 제목 길이: 50-60자
2. 첫 단락: 150-160자 내외 (메타 설명처럼)
3. 내부 링크 위치 표시: [관련 글: XXX] 형태로 제안
4. 중요 문구에 <b> 태그 (2-3개 단어)
5. 모든 이미지에 alt 속성 필수

## 출력 형식 (엄격히 준수)

다음 JSON 형식으로 응답해주세요:
{
  "title": "SEO 최적화된 블로그 제목 (60자 이내)",
  "content": "순수 HTML 본문 (h1 제목 포함, 이미지 프롬프트 및 placeholder 포함)",
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

### content 필드 작성 규칙
1. 순수 HTML만 출력 (코드블록 래퍼 없이)
2. 첫 줄: <h1>제목</h1>
3. 이미지 위치에 placeholder HTML 삽입
4. 마지막 줄: 결론 단락 </p>
5. 주석이나 설명 텍스트 제외
6. <div> 컨테이너로 감싸지 않음

## 절대 금지 사항

1. 마크다운 문법 (*, **, #, -, 백틱 등)
2. 코드블록 표시 (백틱html, 백틱typescript 등)
3. 특수 기호 장식 (***, ---, ===)
4. 콜론(:) 사용 (제목이나 리스트에서)
5. AI 티 나는 표현
   - "~에 대해 알아보겠습니다"
   - "이 글에서는 다음을 다룹니다"
   - "지금부터 살펴보겠습니다"
6. 과장되거나 광고성 문구
7. 개인정보나 민감한 정보
8. 타사 상표권 침해 표현
9. 중복/복사된 콘텐츠
10. 저작권 침해 이미지나 불법 콘텐츠

## 애드센스 승인 체크리스트

- 최소 글자 수 {{minLength}}자 이상
- 독창적이고 고유한 콘텐츠
- 사용자에게 실질적 가치 제공
- 명확하고 읽기 쉬운 구조
- 자연스러운 키워드 사용 (키워드 스터핑 없음)
- 고품질 이미지 2-3개 포함 (alt 속성 필수)
- 핵심 섹션에만 이미지 배치 (발행 속도 최적화)
- 금지된 콘텐츠 회피 (성인/폭력/불법/저작권 침해)
- 모바일 친화적 짧은 단락
- 신뢰할 수 있는 정보 제공
- 시각적으로 매력적인 레이아웃

이제 위 지침을 완벽히 따라 **고품질 이미지가 포함된 블로그 콘텐츠**를 작성하세요.
`;

export const MIN_CONTENT_LENGTH = 5000;
export const MAX_CONTENT_LENGTH = 15000;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 16384;
