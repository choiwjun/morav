/**
 * @jest-environment node
 */

import { collectNaverTrends } from '@/lib/keywords/naver';

// Mock fetch
global.fetch = jest.fn();

describe('Naver Trends Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectNaverTrends', () => {
    it('should return keywords on successful API call', async () => {
      const mockResponse = {
        keywordList: [
          { rank: 1, keyword: '오늘 날씨' },
          { rank: 2, keyword: '주식 시세' },
          { rank: 3, keyword: '맛집 추천' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await collectNaverTrends();

      expect(result.success).toBe(true);
      expect(result.source).toBe('naver');
      expect(result.keywords).toBeDefined();
      expect(result.keywords!.length).toBeGreaterThan(0);
      expect(result.collectedAt).toBeDefined();
    });

    it('should fallback to alternative when API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await collectNaverTrends();

      // Alternative method should still succeed with mock data
      expect(result.success).toBe(true);
      expect(result.source).toBe('naver');
      expect(result.keywords).toBeDefined();
    });

    it('should fallback to alternative on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await collectNaverTrends();

      expect(result.success).toBe(true);
      expect(result.source).toBe('naver');
    });

    it('should include category and trend score for each keyword', async () => {
      const mockResponse = {
        keywordList: [
          { rank: 1, keyword: '건강검진' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await collectNaverTrends();

      expect(result.success).toBe(true);
      if (result.keywords && result.keywords.length > 0) {
        expect(result.keywords[0].category).toBeDefined();
        expect(result.keywords[0].trendScore).toBeDefined();
        expect(result.keywords[0].rank).toBeDefined();
      }
    });

    it('should calculate trend score based on rank', async () => {
      const mockResponse = {
        keywordList: [
          { rank: 1, keyword: '1위 키워드' },
          { rank: 10, keyword: '10위 키워드' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await collectNaverTrends();

      expect(result.success).toBe(true);
      if (result.keywords && result.keywords.length >= 2) {
        // 1위는 100점, 10위는 91점
        expect(result.keywords[0].trendScore).toBe(100);
        expect(result.keywords[1].trendScore).toBe(91);
      }
    });

    it('should handle empty keyword list', async () => {
      const mockResponse = {
        keywordList: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await collectNaverTrends();

      // Empty list triggers fallback to alternative
      expect(result.success).toBe(true);
      expect(result.keywords).toBeDefined();
    });
  });
});
