// 네이버 트렌드 키워드 수집기
// 네이버 데이터랩 API를 사용하여 실제 검색 트렌드 키워드를 수집합니다.

import { TrendKeyword, KeywordCollectionResult } from './types';
import { classifyKeyword } from './classifier';

const NAVER_DATALAB_SEARCH_URL = 'https://openapi.naver.com/v1/datalab/search';
const REQUEST_TIMEOUT = 15000; // 15초

// 실제 인기 있는 세부 키워드들 (카테고리별 구체적인 검색어)
const TRENDING_KEYWORD_GROUPS = [
  // IT/기술 - 구체적인 검색어
  [
    { groupName: 'ChatGPT 사용법', keywords: ['ChatGPT 사용법', 'GPT 프롬프트'], category: 'it' },
    { groupName: '아이폰16 후기', keywords: ['아이폰16 후기', '아이폰16 가격'], category: 'it' },
    { groupName: '갤럭시S24 비교', keywords: ['갤럭시S24 비교', '갤럭시S24 스펙'], category: 'it' },
    { groupName: '클로드 AI', keywords: ['클로드 AI', 'Claude AI'], category: 'it' },
    { groupName: '노트북 추천', keywords: ['노트북 추천', '노트북 비교'], category: 'it' },
  ],
  // 경제/금융
  [
    { groupName: '주식 추천', keywords: ['주식 추천', '주식 종목'], category: 'business' },
    { groupName: '비트코인 전망', keywords: ['비트코인 전망', '비트코인 시세'], category: 'business' },
    { groupName: '부동산 전망', keywords: ['부동산 전망', '아파트 시세'], category: 'business' },
    { groupName: '적금 금리', keywords: ['적금 금리', '예금 금리'], category: 'business' },
    { groupName: 'ETF 추천', keywords: ['ETF 추천', 'ETF 투자'], category: 'business' },
  ],
  // 생활/건강
  [
    { groupName: '다이어트 식단', keywords: ['다이어트 식단', '간헐적 단식'], category: 'health' },
    { groupName: '홈트 운동', keywords: ['홈트 운동', '홈트레이닝 루틴'], category: 'health' },
    { groupName: '피부관리 루틴', keywords: ['피부관리 루틴', '스킨케어 순서'], category: 'health' },
    { groupName: '영양제 추천', keywords: ['영양제 추천', '비타민 추천'], category: 'health' },
    { groupName: '수면 개선', keywords: ['수면 개선', '불면증 해결'], category: 'health' },
  ],
  // 여행/레저
  [
    { groupName: '제주도 맛집', keywords: ['제주도 맛집', '제주도 카페'], category: 'travel' },
    { groupName: '일본 여행', keywords: ['일본 여행', '오사카 여행'], category: 'travel' },
    { groupName: '호텔 추천', keywords: ['호텔 추천', '숙소 예약'], category: 'travel' },
    { groupName: '항공권 특가', keywords: ['항공권 특가', '비행기표 싸게'], category: 'travel' },
    { groupName: '캠핑장 추천', keywords: ['캠핑장 추천', '글램핑 추천'], category: 'travel' },
  ],
  // 엔터테인먼트/문화
  [
    { groupName: '넷플릭스 추천', keywords: ['넷플릭스 추천', '넷플릭스 신작'], category: 'entertainment' },
    { groupName: '드라마 추천', keywords: ['드라마 추천', '요즘 드라마'], category: 'entertainment' },
    { groupName: '영화 개봉작', keywords: ['영화 개봉작', '영화 추천'], category: 'entertainment' },
    { groupName: '아이돌 컴백', keywords: ['아이돌 컴백', 'K-pop 신곡'], category: 'entertainment' },
    { groupName: '유튜버 추천', keywords: ['유튜버 추천', '유튜브 채널'], category: 'entertainment' },
  ],
];

interface NaverDatalabResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: Array<{
    title: string;
    keywords: string[];
    data: Array<{ period: string; ratio: number }>;
  }>;
}

/**
 * 네이버 데이터랩 검색어트렌드 API를 통한 키워드 수집
 */
export async function collectNaverTrends(): Promise<KeywordCollectionResult> {
  const collectedAt = new Date().toISOString();

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('네이버 API 키가 설정되지 않았습니다.');
    return {
      success: false,
      error: '네이버 트렌드 키워드 수집에 실패했습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 확인하세요.',
      source: 'naver',
      collectedAt,
    };
  }

  try {
    const allKeywords: TrendKeyword[] = [];

    // 각 키워드 그룹 세트를 순차적으로 호출 (API 제한 고려)
    for (const keywordSet of TRENDING_KEYWORD_GROUPS) {
      await new Promise(resolve => setTimeout(resolve, 150)); // 딜레이
      const result = await fetchDatalabTrends(clientId, clientSecret, keywordSet);
      if (result) {
        allKeywords.push(...result);
      }
    }

    if (allKeywords.length === 0) {
      return {
        success: false,
        error: '네이버 데이터랩 API 결과를 가져올 수 없습니다.',
        source: 'naver',
        collectedAt,
      };
    }

    // 트렌드 점수로 정렬하고 순위 재부여
    allKeywords.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
    allKeywords.forEach((kw, idx) => {
      kw.rank = idx + 1;
    });

    return {
      success: true,
      keywords: allKeywords,
      source: 'naver',
      collectedAt,
    };
  } catch (error) {
    console.error('Naver trends collection error:', error);
    return {
      success: false,
      error: '네이버 트렌드 키워드 수집 중 오류가 발생했습니다.',
      source: 'naver',
      collectedAt,
    };
  }
}

/**
 * 네이버 데이터랩 검색어트렌드 API 호출
 */
async function fetchDatalabTrends(
  clientId: string,
  clientSecret: string,
  keywordGroups: Array<{ groupName: string; keywords: string[]; category: string }>
): Promise<TrendKeyword[] | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  try {
    const response = await fetch(NAVER_DATALAB_SEARCH_URL, {
      method: 'POST',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        timeUnit: 'date',
        keywordGroups: keywordGroups.map(g => ({
          groupName: g.groupName,
          keywords: g.keywords,
        })),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Naver Datalab API error:', response.status, errorText);
      return null;
    }

    const data: NaverDatalabResponse = await response.json();
    const keywords: TrendKeyword[] = [];

    data.results.forEach((result, index) => {
      // 최근 데이터의 ratio를 트렌드 점수로 사용
      const latestRatio = result.data[result.data.length - 1]?.ratio || 0;
      const originalGroup = keywordGroups[index];

      // groupName을 키워드로 사용 (구체적인 검색어)
      keywords.push({
        keyword: result.title, // "ChatGPT 사용법", "아이폰16 후기" 등
        rank: index + 1,
        category: originalGroup?.category || classifyKeyword(result.title).category,
        trendScore: Math.round(latestRatio),
      });
    });

    return keywords;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Datalab fetch error:', error);
    return null;
  }
}
