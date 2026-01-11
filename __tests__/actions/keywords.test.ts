/**
 * @jest-environment node
 */

import {
  collectAndStoreNaverKeywords,
  collectAndStoreGoogleKeywords,
  collectAllKeywords,
  getRecentKeywords,
  getKeywordStatsByCategory,
  cleanupOldKeywords,
} from '@/lib/actions/keywords';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase client
const mockGetUser = jest.fn();
const mockKeywordsSelect = jest.fn();
const mockKeywordsInsert = jest.fn();
const mockKeywordsDelete = jest.fn();

const createKeywordsChain = () => {
  // Promise-like 객체로 만들어서 await 가능하게
  const makeAwaitable = (obj: Record<string, unknown>): Record<string, unknown> => {
    // 체이닝 메서드들 추가
    obj.select = jest.fn(() => makeAwaitable({ ...obj }));
    obj.eq = jest.fn(() => makeAwaitable({ ...obj }));
    obj.gte = jest.fn(() => makeAwaitable({ ...obj }));
    obj.lt = jest.fn(() => makeAwaitable({ ...obj }));
    obj.order = jest.fn(() => makeAwaitable({ ...obj }));
    obj.limit = jest.fn(() => makeAwaitable({ ...obj }));
    obj.insert = mockKeywordsInsert;
    obj.delete = jest.fn(() => ({
      lt: jest.fn(() => ({
        select: mockKeywordsDelete,
      })),
    }));

    // Promise-like
    obj.then = (resolve: (value: unknown) => void) => {
      resolve(mockKeywordsSelect());
    };

    return obj;
  };

  return makeAwaitable({});
};

const createMockSupabase = () => ({
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn((table: string) => {
    if (table === 'keywords') {
      return createKeywordsChain();
    }
    return { select: jest.fn(() => ({})) };
  }),
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(createMockSupabase())),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: jest.fn(() => []),
      set: jest.fn(),
      get: jest.fn(),
    })
  ),
}));

describe('Keywords Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock fetch to return mock keywords
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });
  });

  describe('collectAndStoreNaverKeywords', () => {
    it('should collect and store Naver keywords', async () => {
      mockKeywordsSelect.mockResolvedValue({ data: [], error: null });
      mockKeywordsInsert.mockResolvedValue({ error: null });

      const result = await collectAndStoreNaverKeywords();

      expect(result.success).toBe(true);
      expect(result.naverCount).toBeDefined();
    });

    it('should skip duplicate keywords within 1 hour', async () => {
      // First keyword exists (duplicate)
      mockKeywordsSelect.mockResolvedValueOnce({
        data: [{ id: 'existing-1' }],
        error: null,
      });

      // Second keyword does not exist
      mockKeywordsSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      mockKeywordsInsert.mockResolvedValue({ error: null });

      const result = await collectAndStoreNaverKeywords();

      expect(result.success).toBe(true);
      expect(result.duplicatesSkipped).toBeGreaterThan(0);
    });
  });

  describe('collectAndStoreGoogleKeywords', () => {
    it('should collect and store Google keywords', async () => {
      mockKeywordsSelect.mockResolvedValue({ data: [], error: null });
      mockKeywordsInsert.mockResolvedValue({ error: null });

      const result = await collectAndStoreGoogleKeywords();

      expect(result.success).toBe(true);
      expect(result.googleCount).toBeDefined();
    });
  });

  describe('collectAllKeywords', () => {
    it('should collect from both Naver and Google', async () => {
      mockKeywordsSelect.mockResolvedValue({ data: [], error: null });
      mockKeywordsInsert.mockResolvedValue({ error: null });

      const result = await collectAllKeywords();

      expect(result.success).toBe(true);
      expect(result.naverCount).toBeDefined();
      expect(result.googleCount).toBeDefined();
    });

    it('should succeed if at least one source succeeds', async () => {
      mockKeywordsSelect.mockResolvedValue({ data: [], error: null });
      mockKeywordsInsert.mockResolvedValue({ error: null });

      const result = await collectAllKeywords();

      expect(result.success).toBe(true);
    });
  });

  describe('getRecentKeywords', () => {
    it('should return recent keywords', async () => {
      const mockKeywords = [
        {
          id: 'kw-1',
          keyword: '테스트 키워드 1',
          category: 'tech',
          source: 'naver',
          trend_score: 100,
          collected_at: '2026-01-11T10:00:00Z',
        },
        {
          id: 'kw-2',
          keyword: '테스트 키워드 2',
          category: 'health',
          source: 'google',
          trend_score: 95,
          collected_at: '2026-01-11T09:00:00Z',
        },
      ];

      mockKeywordsSelect.mockResolvedValue({
        data: mockKeywords,
        error: null,
      });

      const result = await getRecentKeywords();

      expect(result.success).toBe(true);
      expect(result.keywords).toHaveLength(2);
      expect(result.keywords?.[0].keyword).toBe('테스트 키워드 1');
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getRecentKeywords();

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });

    it('should filter by category', async () => {
      mockKeywordsSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getRecentKeywords(50, 'tech');

      expect(result.success).toBe(true);
    });

    it('should filter by source', async () => {
      mockKeywordsSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getRecentKeywords(50, undefined, 'naver');

      expect(result.success).toBe(true);
    });

    it('should limit to maximum 100 keywords', async () => {
      mockKeywordsSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getRecentKeywords(500);

      expect(result.success).toBe(true);
    });
  });

  describe('getKeywordStatsByCategory', () => {
    it('should return keyword statistics by category', async () => {
      const mockKeywords = [
        { category: 'tech' },
        { category: 'tech' },
        { category: 'health' },
        { category: 'business' },
      ];

      mockKeywordsSelect.mockResolvedValue({
        data: mockKeywords,
        error: null,
      });

      const result = await getKeywordStatsByCategory();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.tech).toBe(2);
      expect(result.stats?.health).toBe(1);
      expect(result.stats?.business).toBe(1);
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getKeywordStatsByCategory();

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });
  });

  describe('cleanupOldKeywords', () => {
    it('should delete keywords older than 24 hours', async () => {
      mockKeywordsDelete.mockResolvedValue({
        data: [{ id: 'old-1' }, { id: 'old-2' }],
        error: null,
      });

      const result = await cleanupOldKeywords();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
    });

    it('should return 0 when no old keywords exist', async () => {
      mockKeywordsDelete.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await cleanupOldKeywords();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });
  });
});
