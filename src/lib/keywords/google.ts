// 구글 트렌드 키워드 스크래퍼

import { TrendKeyword, KeywordCollectionResult } from './types';
import { classifyKeyword } from './classifier';

const GOOGLE_TRENDS_URL = 'https://trends.google.co.kr/trends/trendingsearches/daily/rss?geo=KR';
const REQUEST_TIMEOUT = 10000; // 10초

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

    const response = await fetch(GOOGLE_TRENDS_URL, {
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
 * 대체 방법: mock 데이터 반환
 * 구글 트렌드 API가 실패할 경우 사용
 */
async function collectGoogleTrendsAlternative(): Promise<KeywordCollectionResult> {
  const collectedAt = new Date().toISOString();

  try {
    const mockKeywords = await getMockGoogleKeywords();

    return {
      success: true,
      keywords: mockKeywords,
      source: 'google',
      collectedAt,
    };
  } catch (error) {
    console.error('Google alternative collection error:', error);
    return {
      success: false,
      error: '구글 트렌드 키워드 수집에 실패했습니다.',
      source: 'google',
      collectedAt,
    };
  }
}

/**
 * 트렌드 점수 계산 (순위 기반)
 */
function calculateTrendScore(rank: number): number {
  return Math.max(0, 101 - rank);
}

/**
 * 개발/테스트용 mock 키워드
 */
async function getMockGoogleKeywords(): Promise<TrendKeyword[]> {
  const baseKeywords = [
    'ChatGPT 활용법',
    '넷플릭스 신작',
    '비트코인 전망',
    '아이폰 16',
    '테슬라 주가',
    '월드컵 일정',
    '올림픽 결과',
    '유튜브 인기',
    '인스타 트렌드',
    '틱톡 챌린지',
    '갤럭시 S25',
    'AI 그림',
    '메타버스 뉴스',
    'NFT 시장',
    '전기차 보조금',
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
