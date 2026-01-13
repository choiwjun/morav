// 구글 트렌드 키워드 스크래퍼

import { TrendKeyword, KeywordCollectionResult } from './types';
import { classifyKeyword } from './classifier';

// 구글 트렌드 RSS 피드 URL (한국)
const GOOGLE_TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=KR';
const REQUEST_TIMEOUT = 15000; // 15초

/**
 * 구글 트렌드 키워드 수집
 * 구글 트렌드 RSS 피드를 통해 일간 인기 검색어를 수집합니다.
 */
export async function collectGoogleTrends(): Promise<KeywordCollectionResult> {
  const collectedAt = new Date().toISOString();

  try {
    // AbortController를 사용한 타임아웃 처리
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(GOOGLE_TRENDS_RSS_URL, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await collectGoogleTrendsAlternative();
    }

    const xmlText = await response.text();
    const keywords = parseGoogleRssResponse(xmlText);

    if (keywords.length === 0) {
      return await collectGoogleTrendsAlternative();
    }

    return {
      success: true,
      keywords,
      source: 'google',
      collectedAt,
    };
  } catch (error) {
    console.error('Google trends collection error:', error);
    return await collectGoogleTrendsAlternative();
  }
}

/**
 * 구글 트렌드 RSS 응답 파싱
 */
function parseGoogleRssResponse(xmlText: string): TrendKeyword[] {
  const keywords: TrendKeyword[] = [];

  try {
    // 간단한 XML 파싱 (정규식 사용)
    // <title> 태그에서 키워드 추출
    const titleRegex = /<title><!\[CDATA\[(.+?)\]\]><\/title>/g;
    let match;
    let rank = 1;

    while ((match = titleRegex.exec(xmlText)) !== null) {
      const keyword = match[1].trim();

      // RSS 피드의 첫 번째 title은 피드 제목이므로 건너뛰기
      if (keyword === 'Daily Search Trends' || keyword.includes('Google Trends')) {
        continue;
      }

      const classification = classifyKeyword(keyword);
      keywords.push({
        keyword,
        rank,
        category: classification.category,
        trendScore: calculateTrendScore(rank),
      });

      rank++;

      // 최대 20개 키워드만 수집
      if (rank > 20) break;
    }

    // CDATA 없는 title 태그도 처리
    if (keywords.length === 0) {
      const simpleTitleRegex = /<title>([^<]+)<\/title>/g;
      rank = 1;

      while ((match = simpleTitleRegex.exec(xmlText)) !== null) {
        const keyword = match[1].trim();

        if (
          keyword === 'Daily Search Trends' ||
          keyword.includes('Google Trends') ||
          keyword.includes('trending')
        ) {
          continue;
        }

        const classification = classifyKeyword(keyword);
        keywords.push({
          keyword,
          rank,
          category: classification.category,
          trendScore: calculateTrendScore(rank),
        });

        rank++;
        if (rank > 20) break;
      }
    }
  } catch {
    console.error('Failed to parse Google RSS response');
  }

  return keywords;
}

/**
 * 대체 방법: SerpAPI를 통한 구글 트렌드 수집 또는 mock 데이터 반환
 * 구글 트렌드 RSS가 실패할 경우 사용
 */
async function collectGoogleTrendsAlternative(): Promise<KeywordCollectionResult> {
  const collectedAt = new Date().toISOString();

  // SerpAPI 키가 설정된 경우 사용
  const serpApiKey = process.env.SERPAPI_KEY;
  if (serpApiKey) {
    try {
      const keywords = await collectFromSerpAPI(serpApiKey);
      if (keywords.length > 0) {
        return {
          success: true,
          keywords,
          source: 'google',
          collectedAt,
        };
      }
    } catch (error) {
      console.error('SerpAPI error:', error);
    }
  }

  // API 키가 없거나 실패한 경우 빈 결과 반환 (mock 데이터 사용 안함)
  console.warn('구글 트렌드 수집 실패: RSS 피드와 SerpAPI 모두 실패했습니다.');
  return {
    success: false,
    error: '구글 트렌드 키워드 수집에 실패했습니다. SERPAPI_KEY를 확인하세요.',
    source: 'google',
    collectedAt,
  };
}

/**
 * SerpAPI를 통한 구글 트렌드 수집
 */
async function collectFromSerpAPI(apiKey: string): Promise<TrendKeyword[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_trends_trending_now');
    url.searchParams.set('geo', 'KR');
    url.searchParams.set('api_key', apiKey);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const keywords: TrendKeyword[] = [];

    // SerpAPI 응답 구조에 맞게 파싱
    const trendingSearches = data.trending_searches || data.daily_searches || [];
    trendingSearches.slice(0, 20).forEach((item: { query?: string; title?: string }, index: number) => {
      const keyword = item.query || item.title;
      if (keyword) {
        const classification = classifyKeyword(keyword);
        keywords.push({
          keyword,
          rank: index + 1,
          category: classification.category,
          trendScore: calculateTrendScore(index + 1),
        });
      }
    });

    return keywords;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 트렌드 점수 계산 (순위 기반)
 */
function calculateTrendScore(rank: number): number {
  return Math.max(0, 101 - rank);
}

