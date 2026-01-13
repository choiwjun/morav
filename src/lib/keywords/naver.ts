// 네이버 트렌드 키워드 수집기

import { TrendKeyword, KeywordCollectionResult } from './types';
import { classifyKeyword } from './classifier';

const NAVER_DATALAB_URL = 'https://datalab.naver.com/keyword/realtimeList.naver';
const NAVER_SHOPPING_TREND_URL = 'https://openapi.naver.com/v1/datalab/shopping/categories';
const REQUEST_TIMEOUT = 10000; // 10초

interface NaverRealtimeKeyword {
  rank: number;
  keyword: string;
  linkUrl?: string;
}

interface NaverShoppingTrendResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: Array<{
    title: string;
    category: string[];
    data: Array<{ period: string; ratio: number }>;
  }>;
}

/**
 * 네이버 실시간 검색어 수집
 * 네이버 데이터랩 실시간 검색어 API를 통해 트렌드 키워드를 수집합니다.
 */
export async function collectNaverTrends(): Promise<KeywordCollectionResult> {
  const collectedAt = new Date().toISOString();

  try {
    // AbortController를 사용한 타임아웃 처리
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(NAVER_DATALAB_URL, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: 'https://datalab.naver.com/',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // API 응답 실패 시 대체 방법 시도
      return await collectNaverTrendsAlternative();
    }

    const data = await response.json();

    // 응답 데이터 파싱
    const keywords: TrendKeyword[] = parseNaverResponse(data);

    if (keywords.length === 0) {
      return await collectNaverTrendsAlternative();
    }

    return {
      success: true,
      keywords,
      source: 'naver',
      collectedAt,
    };
  } catch (error) {
    // 네트워크 에러 또는 타임아웃 시 대체 방법 시도
    console.error('Naver trends collection error:', error);
    return await collectNaverTrendsAlternative();
  }
}

/**
 * 네이버 응답 데이터 파싱
 */
function parseNaverResponse(data: unknown): TrendKeyword[] {
  const keywords: TrendKeyword[] = [];

  try {
    // 네이버 데이터랩 API 응답 구조에 맞게 파싱
    if (data && typeof data === 'object') {
      const responseData = data as { keywordList?: NaverRealtimeKeyword[] };
      const keywordList = responseData.keywordList || [];

      for (const item of keywordList) {
        if (item.keyword) {
          const classification = classifyKeyword(item.keyword);
          keywords.push({
            keyword: item.keyword,
            rank: item.rank || keywords.length + 1,
            category: classification.category,
            trendScore: calculateTrendScore(item.rank || keywords.length + 1),
          });
        }
      }
    }
  } catch {
    console.error('Failed to parse Naver response');
  }

  return keywords;
}

/**
 * 대체 방법: 네이버 쇼핑 트렌드 API 사용
 * 실시간 검색어 API가 실패할 경우 사용
 */
async function collectNaverTrendsAlternative(): Promise<KeywordCollectionResult> {
  const collectedAt = new Date().toISOString();

  // 네이버 API 키가 설정된 경우 공식 API 사용
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (clientId && clientSecret) {
    try {
      const keywords = await collectFromNaverShoppingAPI(clientId, clientSecret);
      if (keywords.length > 0) {
        return {
          success: true,
          keywords,
          source: 'naver',
          collectedAt,
        };
      }
    } catch (error) {
      console.error('Naver Shopping API error:', error);
    }
  }

  // API 키가 없거나 실패한 경우 빈 결과 반환 (mock 데이터 사용 안함)
  console.warn('네이버 트렌드 수집 실패: API 키가 없거나 API 호출에 실패했습니다.');
  return {
    success: false,
    error: '네이버 트렌드 키워드 수집에 실패했습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 확인하세요.',
    source: 'naver',
    collectedAt,
  };
}

/**
 * 네이버 쇼핑 트렌드 API를 통한 키워드 수집
 */
async function collectFromNaverShoppingAPI(
  clientId: string,
  clientSecret: string
): Promise<TrendKeyword[]> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // 주요 쇼핑 카테고리별 트렌드 조회
  const categories = [
    { name: '패션의류', code: '50000000' },
    { name: '디지털/가전', code: '50000001' },
    { name: '생활/건강', code: '50000002' },
    { name: '식품', code: '50000003' },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(NAVER_SHOPPING_TREND_URL, {
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
        category: categories.map((c) => ({ name: c.name, param: [c.code] })),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status}`);
    }

    const data: NaverShoppingTrendResponse = await response.json();
    const keywords: TrendKeyword[] = [];

    data.results.forEach((result, index) => {
      const latestRatio = result.data[result.data.length - 1]?.ratio || 0;
      const classification = classifyKeyword(result.title);
      keywords.push({
        keyword: result.title,
        rank: index + 1,
        category: classification.category,
        trendScore: Math.round(latestRatio),
      });
    });

    return keywords;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 트렌드 점수 계산 (순위 기반)
 * 상위 순위일수록 높은 점수
 */
function calculateTrendScore(rank: number): number {
  // 1위: 100점, 10위: 91점, 20위: 81점, ...
  return Math.max(0, 101 - rank);
}

