'use server';

/**
 * Unsplash API를 이용한 무료 이미지 검색
 * https://unsplash.com/developers
 */

export interface UnsplashImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  downloadUrl: string;
}

export interface UnsplashSearchResult {
  success: boolean;
  images?: UnsplashImage[];
  error?: string;
}

// 한글 -> 영문 번역 매핑 (내부 사용)
const translations: Record<string, string> = {
  // 기술/IT
  '인공지능': 'artificial intelligence',
  'AI': 'artificial intelligence',
  '프로그래밍': 'programming coding',
  '개발': 'software development',
  '컴퓨터': 'computer technology',
  '스마트폰': 'smartphone mobile',
  '앱': 'mobile app',

  // 비즈니스/경제
  '비즈니스': 'business office',
  '경제': 'economy finance',
  '투자': 'investment money',
  '주식': 'stock market',
  '창업': 'startup business',
  '마케팅': 'marketing business',

  // 라이프스타일
  '여행': 'travel vacation',
  '음식': 'food cuisine',
  '요리': 'cooking kitchen',
  '건강': 'health wellness',
  '운동': 'fitness exercise',
  '다이어트': 'diet healthy',
  '패션': 'fashion style',
  '뷰티': 'beauty cosmetics',

  // 기타
  '교육': 'education learning',
  '자기계발': 'self improvement',
  '부동산': 'real estate',
  '인테리어': 'interior design',
  '자동차': 'car automobile',
  '환경': 'environment nature',
};

/**
 * 키워드를 영문 검색어로 변환 (내부 함수)
 */
function translateKeywordToEnglishInternal(keyword: string): string {
  // 이미 영문이면 그대로 반환
  if (/^[a-zA-Z\s]+$/.test(keyword)) {
    return keyword;
  }

  // 매핑된 키워드 찾기
  for (const [korean, english] of Object.entries(translations)) {
    if (keyword.includes(korean)) {
      return english;
    }
  }

  // 매핑 없으면 일반적인 키워드 반환
  return 'professional business';
}

/**
 * Lorem Picsum에서 랜덤 이미지 (최종 백업) - 내부 함수
 */
function getRandomPicsumImageInternal(alt: string): UnsplashSearchResult {
  // 랜덤 seed 생성
  const seed = Math.random().toString(36).substring(7);
  const width = 1200;
  const height = 800;

  const image: UnsplashImage = {
    id: seed,
    url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
    thumbnailUrl: `https://picsum.photos/seed/${seed}/400/267`,
    alt: alt,
    photographer: 'Lorem Picsum',
    photographerUrl: 'https://picsum.photos',
    downloadUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
  };

  return { success: true, images: [image] };
}

/**
 * Pexels에서 이미지 검색 (백업용) - 내부 함수
 */
async function searchPexelsImagesInternal(
  query: string,
  perPage: number = 1
): Promise<UnsplashSearchResult> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    // 두 API 키 모두 없으면 Picsum 사용
    return getRandomPicsumImageInternal(query);
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return getRandomPicsumImageInternal(query);
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return getRandomPicsumImageInternal(query);
    }

    const images: UnsplashImage[] = data.photos.map((photo: {
      id: number;
      src: { large: string; medium: string };
      alt: string | null;
      photographer: string;
      photographer_url: string;
    }) => ({
      id: String(photo.id),
      url: photo.src.large,
      thumbnailUrl: photo.src.medium,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      downloadUrl: photo.src.large,
    }));

    return { success: true, images };
  } catch (error) {
    console.error('Pexels search error:', error);
    return getRandomPicsumImageInternal(query);
  }
}

/**
 * Unsplash에서 이미지 검색
 * @param query 검색어 (영문 권장)
 * @param perPage 가져올 이미지 수 (기본 1)
 */
export async function searchUnsplashImages(
  query: string,
  perPage: number = 1
): Promise<UnsplashSearchResult> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    // Unsplash API 키가 없으면 Pexels 시도
    return searchPexelsImagesInternal(query, perPage);
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      // Unsplash 실패시 Pexels 시도
      return searchPexelsImagesInternal(query, perPage);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      // 결과 없으면 Pexels 시도
      return searchPexelsImagesInternal(query, perPage);
    }

    const images: UnsplashImage[] = data.results.map((photo: {
      id: string;
      urls: { regular: string; thumb: string };
      alt_description: string | null;
      description: string | null;
      user: { name: string; links: { html: string } };
      links: { download_location: string };
    }) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.thumb,
      alt: photo.alt_description || photo.description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadUrl: photo.links.download_location,
    }));

    return { success: true, images };
  } catch (error) {
    console.error('Unsplash search error:', error);
    // 에러 발생시 Pexels 시도
    return searchPexelsImagesInternal(query, perPage);
  }
}

/**
 * 콘텐츠 주제에서 이미지 검색어 추출
 */
export async function extractImageSearchQuery(
  keyword: string,
  sectionTitle?: string,
  altText?: string
): Promise<string> {
  // alt 텍스트가 있고 영문이면 사용
  if (altText && /[a-zA-Z]/.test(altText)) {
    // 한글 제거하고 영문만 추출
    const englishOnly = altText.replace(/[^a-zA-Z\s]/g, '').trim();
    if (englishOnly.length > 3) {
      return englishOnly;
    }
  }

  // 섹션 제목에서 핵심 키워드 추출
  if (sectionTitle) {
    const translated = translateKeywordToEnglishInternal(sectionTitle);
    if (translated !== 'professional business') {
      return translated;
    }
  }

  // 메인 키워드 번역
  return translateKeywordToEnglishInternal(keyword);
}
