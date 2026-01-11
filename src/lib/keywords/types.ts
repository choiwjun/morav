// 키워드 수집 관련 타입 정의

export interface TrendKeyword {
  keyword: string;
  rank: number;
  category?: string;
  trendScore?: number;
}

export interface KeywordCollectionResult {
  success: boolean;
  keywords?: TrendKeyword[];
  error?: string;
  source: 'naver' | 'google';
  collectedAt: string;
}

export interface StoredKeyword {
  id: string;
  keyword: string;
  category: string;
  source: 'naver' | 'google';
  trendScore: number;
  collectedAt: string;
}

export interface KeywordClassificationResult {
  keyword: string;
  category: string;
  confidence: number;
}
