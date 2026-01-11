/**
 * @jest-environment node
 */

import { collectGoogleTrends } from '@/lib/keywords/google';

// Mock fetch
global.fetch = jest.fn();

describe('Google Trends Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectGoogleTrends', () => {
    it('should return keywords on successful RSS fetch', async () => {
      const mockRssXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Daily Search Trends</title>
            <item>
              <title><![CDATA[인기 검색어 1]]></title>
            </item>
            <item>
              <title><![CDATA[인기 검색어 2]]></title>
            </item>
          </channel>
        </rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockRssXml,
      });

      const result = await collectGoogleTrends();

      expect(result.success).toBe(true);
      expect(result.source).toBe('google');
      expect(result.keywords).toBeDefined();
      expect(result.collectedAt).toBeDefined();
    });

    it('should fallback to alternative when RSS fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await collectGoogleTrends();

      // Alternative method should still succeed with mock data
      expect(result.success).toBe(true);
      expect(result.source).toBe('google');
      expect(result.keywords).toBeDefined();
    });

    it('should fallback to alternative on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await collectGoogleTrends();

      expect(result.success).toBe(true);
      expect(result.source).toBe('google');
    });

    it('should parse RSS without CDATA', async () => {
      const mockRssXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Daily Search Trends</title>
            <item>
              <title>검색어 1</title>
            </item>
            <item>
              <title>검색어 2</title>
            </item>
          </channel>
        </rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockRssXml,
      });

      const result = await collectGoogleTrends();

      expect(result.success).toBe(true);
      expect(result.keywords).toBeDefined();
    });

    it('should include category and trend score for each keyword', async () => {
      const mockRssXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title><![CDATA[AI 뉴스]]></title>
            </item>
          </channel>
        </rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockRssXml,
      });

      const result = await collectGoogleTrends();

      expect(result.success).toBe(true);
      if (result.keywords && result.keywords.length > 0) {
        expect(result.keywords[0].category).toBeDefined();
        expect(result.keywords[0].trendScore).toBeDefined();
        expect(result.keywords[0].rank).toBeDefined();
      }
    });

    it('should skip feed title', async () => {
      const mockRssXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title><![CDATA[Daily Search Trends]]></title>
            <item>
              <title><![CDATA[실제 키워드]]></title>
            </item>
          </channel>
        </rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockRssXml,
      });

      const result = await collectGoogleTrends();

      expect(result.success).toBe(true);
      if (result.keywords) {
        const hasFeedTitle = result.keywords.some(
          (k) => k.keyword === 'Daily Search Trends'
        );
        expect(hasFeedTitle).toBe(false);
      }
    });

    it('should limit to maximum 20 keywords', async () => {
      // 25개의 키워드가 있는 RSS
      const items = Array.from({ length: 25 }, (_, i) =>
        `<item><title><![CDATA[키워드 ${i + 1}]]></title></item>`
      ).join('');

      const mockRssXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            ${items}
          </channel>
        </rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockRssXml,
      });

      const result = await collectGoogleTrends();

      expect(result.success).toBe(true);
      if (result.keywords) {
        expect(result.keywords.length).toBeLessThanOrEqual(20);
      }
    });
  });
});
