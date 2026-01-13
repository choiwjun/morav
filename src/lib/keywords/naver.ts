// 네이버 트렌드 키워드 수집기

import { TrendKeyword, KeywordCollectionResult } from './types';
import { classifyKeyword } from './classifier';

const NAVER_SEARCH_URL = 'https://openapi.naver.com/v1/search/blog.json';
const REQUEST_TIMEOUT = 10000; // 10초

// 수집할 인기 키워드 목록 (다양한 카테고리)
const TRENDING_KEYWORDS = [
  // IT/기술
  'AI 트렌드', 'ChatGPT 활용', '아이폰 신제품', '갤럭시 출시', '테슬라 뉴스',
  // 경제/금융
  '주식 전망', '비트코인 시세', '부동산 동향', '금리 인상', '환율 변동',
  // 생활/건강
  '다이어트 방법', '홈트레이닝', '건강식품 추천', '피부관리 팁', '수면 개선',
  // 여행/레저
  '국내여행 추천', '해외여행 준비', '호텔 예약', '항공권 특가', '맛집 탐방',
  // 엔터테인먼트
  '넷플릭스 신작', '인기 드라마', 'K-pop 뉴스', '영화 개봉', '유튜브 트렌드',
];

interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: Array<{
    title: string;
    link: string;
    description: string;
    bloggername: string;
    bloggerlink: string;
    postdate: string;
  }>;
}

/**
 * 네이버 검색 API를 통한 트렌드 키워드 수집
 * 인기 키워드로 검색하여 연관 키워드와 트렌드 점수를 계산합니다.
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
    const keywords: TrendKeyword[] = [];

    // 각 트렌딩 키워드로 검색하여 결과 수집
    for (let i = 0; i < TRENDING_KEYWORDS.length; i++) {
      const searchKeyword = TRENDING_KEYWORDS[i];

      try {
        const result = await searchNaverBlog(clientId, clientSecret, searchKeyword);

        if (result && result.total > 0) {
          const classification = classifyKeyword(searchKeyword);
          keywords.push({
            keyword: searchKeyword,
            rank: i + 1,
            category: classification.category,
            // 검색 결과 수를 기반으로 트렌드 점수 계산 (최대 100)
            trendScore: Math.min(100, Math.round(result.total / 1000)),
          });
        }
      } catch (error) {
        console.error(`Failed to search for "${searchKeyword}":`, error);
      }

      // API 호출 간 약간의 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (keywords.length === 0) {
      return {
        success: false,
        error: '네이버 검색 결과를 가져올 수 없습니다.',
        source: 'naver',
        collectedAt,
      };
    }

    // 트렌드 점수로 정렬
    keywords.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));

    return {
      success: true,
      keywords,
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
 * 네이버 블로그 검색 API 호출
 */
async function searchNaverBlog(
  clientId: string,
  clientSecret: string,
  query: string
): Promise<NaverSearchResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const url = new URL(NAVER_SEARCH_URL);
    url.searchParams.set('query', query);
    url.searchParams.set('display', '10');
    url.searchParams.set('sort', 'date');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Naver search API error:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
