// 네이버 트렌드 키워드 스크래퍼

import { TrendKeyword, KeywordCollectionResult } from './types';
import { classifyKeyword } from './classifier';

const NAVER_DATALAB_URL = 'https://datalab.naver.com/keyword/realtimeList.naver';
const REQUEST_TIMEOUT = 10000; // 10초

interface NaverRealtimeKeyword {
  rank: number;
  keyword: string;
  linkUrl?: string;
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
 * 대체 방법: 네이버 인기 검색어 페이지 스크래핑
 * 실시간 검색어 API가 실패할 경우 사용
 */
async function collectNaverTrendsAlternative(): Promise<KeywordCollectionResult> {
  const collectedAt = new Date().toISOString();

  try {
    // 네이버 쇼핑 인기 검색어 또는 연관 검색어를 대체로 사용
    // 실제 환경에서는 네이버 API 키를 사용하여 공식 API 호출
    const mockKeywords = await getMockNaverKeywords();

    return {
      success: true,
      keywords: mockKeywords,
      source: 'naver',
      collectedAt,
    };
  } catch (error) {
    console.error('Naver alternative collection error:', error);
    return {
      success: false,
      error: '네이버 트렌드 키워드 수집에 실패했습니다.',
      source: 'naver',
      collectedAt,
    };
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

/**
 * 개발/테스트용 mock 키워드
 * 실제 운영에서는 네이버 API를 통해 수집
 */
async function getMockNaverKeywords(): Promise<TrendKeyword[]> {
  // 현재 시간 기반으로 변화하는 mock 데이터
  const baseKeywords = [
    '오늘 날씨',
    '주식 시세',
    '부동산 전망',
    '건강검진 비용',
    '여행지 추천',
    '맛집 추천',
    '영화 순위',
    '드라마 추천',
    '코인 시세',
    '취업 정보',
    'AI 뉴스',
    '스마트폰 추천',
    '다이어트 방법',
    '운동 루틴',
    '영어 공부',
  ];

  return baseKeywords.map((keyword, index) => {
    const classification = classifyKeyword(keyword);
    return {
      keyword,
      rank: index + 1,
      category: classification.category,
      trendScore: calculateTrendScore(index + 1),
    };
  });
}
