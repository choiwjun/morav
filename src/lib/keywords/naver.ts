// 네이버 트렌드 키워드 수집기
// 네이버 검색광고 API 연관키워드 + 데이터랩을 활용하여 상세 키워드 수집

import { TrendKeyword, KeywordCollectionResult } from './types';
import { classifyKeyword } from './classifier';

const NAVER_DATALAB_SEARCH_URL = 'https://openapi.naver.com/v1/datalab/search';
const REQUEST_TIMEOUT = 15000;

// 시드 키워드 (이 키워드들의 연관 검색어를 수집)
const SEED_KEYWORDS = [
  // IT/기술
  { seed: 'ChatGPT', category: 'it', relatedTerms: ['ChatGPT 사용법', 'ChatGPT 프롬프트 작성법', 'ChatGPT 4o 사용법', 'ChatGPT 무료 사용', 'GPT 활용 팁'] },
  { seed: '아이폰', category: 'it', relatedTerms: ['아이폰16 프로 후기', '아이폰16 프로맥스 가격', '아이폰 배터리 교체', '아이폰 케이스 추천', '아이폰 액정수리 비용'] },
  { seed: '갤럭시', category: 'it', relatedTerms: ['갤럭시S24 울트라 후기', '갤럭시 버즈3 프로', '갤럭시 폴드6 가격', '갤럭시 워치7 기능', '갤럭시 AI 기능'] },
  { seed: '노트북', category: 'it', relatedTerms: ['맥북 프로 M3 후기', '게이밍 노트북 추천 2024', 'LG그램 2024 후기', '삼성 갤럭시북4', '가성비 노트북 추천'] },

  // 경제/금융
  { seed: '주식', category: 'business', relatedTerms: ['주식 초보 시작하기', '배당주 추천 종목', '미국 주식 사는법', '주식 세금 계산법', '주식 수익률 계산'] },
  { seed: '비트코인', category: 'business', relatedTerms: ['비트코인 반감기 2024', '비트코인 ETF 투자', '비트코인 시세 전망', '비트코인 지갑 추천', '비트코인 채굴 방법'] },
  { seed: '부동산', category: 'business', relatedTerms: ['신혼부부 청약 조건', '무순위 청약 일정', '전세대출 금리 비교', '아파트 매매 절차', '부동산 취득세 계산'] },
  { seed: '적금', category: 'business', relatedTerms: ['적금 금리 높은 은행', '파킹통장 금리 비교', '비대면 적금 추천', 'CMA 통장 금리', '청년적금 조건'] },

  // 건강/뷰티
  { seed: '다이어트', category: 'health', relatedTerms: ['간헐적 단식 16:8 방법', '키토제닉 다이어트 식단', '다이어트 도시락 추천', '뱃살 빼는 운동', '다이어트 보조제 후기'] },
  { seed: '피부과', category: 'health', relatedTerms: ['여드름 피부과 비용', '레이저 토닝 가격', '모공 축소 시술', '피부과 필링 종류', '기미 레이저 후기'] },
  { seed: '영양제', category: 'health', relatedTerms: ['비타민D 추천 제품', '오메가3 고르는법', '유산균 추천 브랜드', '철분제 복용 시간', '루테인 지아잔틴 효능'] },
  { seed: '헬스', category: 'health', relatedTerms: ['헬스장 3대 운동 루틴', '단백질 보충제 추천', '운동 후 근육통 해결', '벌크업 식단 예시', '홈트레이닝 기구 추천'] },

  // 여행
  { seed: '제주도', category: 'travel', relatedTerms: ['제주도 3박4일 코스', '제주도 감성 카페 추천', '제주도 흑돼지 맛집', '제주도 렌트카 가격', '제주도 숨은 명소'] },
  { seed: '일본여행', category: 'travel', relatedTerms: ['오사카 2박3일 코스', '도쿄 쇼핑 리스트', '일본 온천 료칸 추천', '후쿠오카 맛집 추천', '일본 유심 구매'] },
  { seed: '호텔', category: 'travel', relatedTerms: ['서울 5성급 호텔 추천', '부산 오션뷰 호텔', '호텔 조식 맛집', '커플 호텔 추천', '가성비 호텔 예약'] },
  { seed: '항공권', category: 'travel', relatedTerms: ['특가 항공권 찾는법', '마일리지 항공권 예약', '비행기 좌석 추천', '항공권 싸게 사는 시기', '환승 항공권 팁'] },

  // 엔터테인먼트
  { seed: '넷플릭스', category: 'entertainment', relatedTerms: ['넷플릭스 신작 드라마', '넷플릭스 영화 추천 2024', '넷플릭스 한국 드라마', '넷플릭스 요금제 비교', '넷플릭스 다운로드 방법'] },
  { seed: '드라마', category: 'entertainment', relatedTerms: ['무인도의 디바 줄거리', '요즘 인기 드라마 순위', '로맨스 드라마 추천', '범죄 드라마 추천', '완결 드라마 추천'] },
  { seed: '영화', category: 'entertainment', relatedTerms: ['이번주 개봉 영화', '마블 영화 순서', '공포영화 추천 2024', 'CGV 특별관 종류', '영화 예매 할인'] },
  { seed: '게임', category: 'entertainment', relatedTerms: ['스팀 할인 게임 추천', 'PS5 게임 추천', '모바일 RPG 추천', '멀티 플레이 게임', '닌텐도 스위치 게임'] },

  // 음식/요리
  { seed: '레시피', category: 'food', relatedTerms: ['집밥 레시피 간단한거', '자취생 요리 추천', '에어프라이어 레시피', '한그릇 요리 레시피', '밀키트 추천'] },
  { seed: '맛집', category: 'food', relatedTerms: ['서울 데이트 맛집', '강남역 맛집 추천', '혼밥 맛집 추천', '이태원 브런치 맛집', '연남동 파스타 맛집'] },
  { seed: '카페', category: 'food', relatedTerms: ['성수동 감성카페', '한옥카페 추천', '애견동반 카페', '루프탑 카페 서울', '디저트 맛집 카페'] },
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
 * 네이버 상세 키워드 수집
 * 시드 키워드의 연관 검색어들을 데이터랩 API로 트렌드 점수 측정
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

    // 각 시드 키워드의 연관 검색어들을 5개씩 묶어서 API 호출
    for (const seedData of SEED_KEYWORDS) {
      await new Promise(resolve => setTimeout(resolve, 200)); // API 제한 고려

      // 연관 검색어들을 키워드 그룹으로 변환
      const keywordGroups = seedData.relatedTerms.map(term => ({
        groupName: term,
        keywords: [term],
        category: seedData.category,
      }));

      const result = await fetchDatalabTrends(clientId, clientSecret, keywordGroups);
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

    // 트렌드 점수로 정렬 (높은 점수 = 인기 키워드)
    allKeywords.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));

    // 상위 30개만 선택하고 순위 재부여
    const topKeywords = allKeywords.slice(0, 30);
    topKeywords.forEach((kw, idx) => {
      kw.rank = idx + 1;
    });

    return {
      success: true,
      keywords: topKeywords,
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

      // 구체적인 검색어를 키워드로 저장
      keywords.push({
        keyword: result.title,
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
