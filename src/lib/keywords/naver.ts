// 네이버 트렌드 키워드 수집기

import { TrendKeyword, KeywordCollectionResult } from './types';
import { classifyKeyword } from './classifier';

const NAVER_DATALAB_SEARCH_URL = 'https://openapi.naver.com/v1/datalab/search';
const REQUEST_TIMEOUT = 15000; // 15초

// 수집할 인기 키워드 그룹 (최대 5개 그룹, 각 그룹당 최대 20개 키워드)
const KEYWORD_GROUPS = [
  {
    groupName: 'AI 트렌드',
    keywords: ['AI', 'ChatGPT', '인공지능', 'GPT', '클로드'],
    category: 'it',
  },
  {
    groupName: '스마트폰',
    keywords: ['아이폰', '갤럭시', '삼성폰', '애플', '폴드'],
    category: 'it',
  },
  {
    groupName: '투자',
    keywords: ['주식', '비트코인', '부동산', '금투자', 'ETF'],
    category: 'business',
  },
  {
    groupName: '건강',
    keywords: ['다이어트', '운동', '헬스', '필라테스', '요가'],
    category: 'health',
  },
  {
    groupName: '여행',
    keywords: ['국내여행', '해외여행', '호텔', '항공권', '제주도'],
    category: 'travel',
  },
];

// 추가 개별 키워드 그룹들 (순차적으로 API 호출)
const ADDITIONAL_KEYWORD_SETS = [
  [
    { groupName: '넷플릭스', keywords: ['넷플릭스', '드라마추천'], category: 'entertainment' },
    { groupName: '유튜브', keywords: ['유튜브', '유튜버'], category: 'entertainment' },
    { groupName: 'K-pop', keywords: ['아이돌', 'K-pop', 'BTS'], category: 'entertainment' },
    { groupName: '영화', keywords: ['영화', '영화추천', '개봉영화'], category: 'entertainment' },
    { groupName: '맛집', keywords: ['맛집', '맛집추천', '카페'], category: 'food' },
  ],
  [
    { groupName: '뷰티', keywords: ['화장품', '스킨케어', '뷰티'], category: 'lifestyle' },
    { groupName: '패션', keywords: ['패션', '코디', '옷추천'], category: 'lifestyle' },
    { groupName: '자동차', keywords: ['전기차', '테슬라', '자동차'], category: 'it' },
    { groupName: '게임', keywords: ['게임', '스팀', '닌텐도'], category: 'entertainment' },
    { groupName: '부업', keywords: ['부업', '재테크', 'N잡'], category: 'business' },
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

    // 첫 번째 키워드 그룹 세트 호출
    const firstResult = await fetchDatalabTrends(clientId, clientSecret, KEYWORD_GROUPS);
    if (firstResult) {
      allKeywords.push(...firstResult);
    }

    // 추가 키워드 세트들 순차 호출 (API 제한 고려)
    for (const keywordSet of ADDITIONAL_KEYWORD_SETS) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 딜레이
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

      // 대표 키워드로 저장 (첫번째 키워드 사용)
      const mainKeyword = originalGroup?.keywords[0] || result.title;
      const classification = classifyKeyword(mainKeyword);

      keywords.push({
        keyword: mainKeyword,
        rank: index + 1,
        category: originalGroup?.category || classification.category,
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
