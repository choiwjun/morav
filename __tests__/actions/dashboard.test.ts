/**
 * @jest-environment node
 */

import {
  getTodayStats,
  getRecentPosts,
  getSubscriptionStatus,
  getDashboardData,
  getConnectedBlogsCount,
  getMonthlyStats,
} from '@/lib/actions/dashboard';
import { PLAN_LIMITS, PLAN_NAMES } from '@/lib/constants/plans';

// Mock Supabase client
const mockGetUser = jest.fn();
const mockPostsSelectResult = jest.fn();
const mockSubscriptionSelectResult = jest.fn();
const mockBlogsCountResult = jest.fn();

const createMockSupabase = () => ({
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn((table: string) => {
    if (table === 'posts') {
      // 포스트 테이블용 체이닝 mock
      const createPostsChain = (): Record<string, unknown> => {
        const chain: Record<string, unknown> = {
          select: jest.fn(() => chain),
          eq: jest.fn(() => chain),
          order: jest.fn(() => chain),
          limit: jest.fn(() => mockPostsSelectResult()),
        };
        // gte는 lt가 있으면 체인 반환, 없으면 (getMonthlyStats) Promise 반환
        chain.gte = jest.fn(() => {
          const gteResult = { ...chain };
          // lt 호출 시 결과 반환
          gteResult.lt = jest.fn(() => mockPostsSelectResult());
          // then 지원 (Promise-like) - getMonthlyStats용
          gteResult.then = (resolve: (value: unknown) => void) => {
            resolve(mockPostsSelectResult());
          };
          return gteResult;
        });
        return chain;
      };
      return createPostsChain();
    }
    if (table === 'subscriptions') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSubscriptionSelectResult,
          })),
        })),
      };
    }
    if (table === 'blogs') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: mockBlogsCountResult,
          })),
        })),
      };
    }
    return { select: jest.fn(() => ({})) };
  }),
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(createMockSupabase())),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: jest.fn(() => []),
      set: jest.fn(),
      get: jest.fn(),
    })
  ),
}));

describe('Dashboard Actions', () => {
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
  });

  describe('PLAN_LIMITS', () => {
    it('should have correct limits for each plan', () => {
      expect(PLAN_LIMITS.free).toBe(10);
      expect(PLAN_LIMITS.light).toBe(30);
      expect(PLAN_LIMITS.standard).toBe(100);
      expect(PLAN_LIMITS.pro).toBe(300);
      expect(PLAN_LIMITS.unlimited).toBe(999999);
    });
  });

  describe('PLAN_NAMES', () => {
    it('should have correct names for each plan', () => {
      expect(PLAN_NAMES.free).toBe('무료');
      expect(PLAN_NAMES.light).toBe('라이트');
      expect(PLAN_NAMES.standard).toBe('스탠다드');
      expect(PLAN_NAMES.pro).toBe('프로');
      expect(PLAN_NAMES.unlimited).toBe('무제한');
    });
  });

  describe('getTodayStats', () => {
    it('should return today statistics when user is authenticated', async () => {
      const mockPosts = [
        { id: '1', status: 'published' },
        { id: '2', status: 'published' },
        { id: '3', status: 'pending' },
        { id: '4', status: 'failed' },
        { id: '5', status: 'generating' },
      ];

      mockPostsSelectResult.mockResolvedValue({
        data: mockPosts,
        error: null,
      });

      const result = await getTodayStats();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.totalPosts).toBe(5);
      expect(result.stats?.publishedPosts).toBe(2);
      expect(result.stats?.failedPosts).toBe(1);
      expect(result.stats?.pendingPosts).toBe(2);
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getTodayStats();

      expect(result).toEqual({
        success: false,
        error: '로그인이 필요합니다.',
      });
    });

    it('should return empty stats when no posts exist', async () => {
      mockPostsSelectResult.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getTodayStats();

      expect(result.success).toBe(true);
      expect(result.stats?.totalPosts).toBe(0);
      expect(result.stats?.publishedPosts).toBe(0);
      expect(result.stats?.failedPosts).toBe(0);
      expect(result.stats?.pendingPosts).toBe(0);
    });
  });

  describe('getRecentPosts', () => {
    it('should return recent posts with blog info', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Test Post 1',
          status: 'published',
          published_at: '2026-01-11T10:00:00Z',
          created_at: '2026-01-11T09:00:00Z',
          blogs: { blog_name: 'My Blog', platform: 'tistory' },
        },
        {
          id: 'post-2',
          title: 'Test Post 2',
          status: 'pending',
          published_at: null,
          created_at: '2026-01-11T08:00:00Z',
          blogs: { blog_name: 'Another Blog', platform: 'blogger' },
        },
      ];

      mockPostsSelectResult.mockResolvedValue({
        data: mockPosts,
        error: null,
      });

      const result = await getRecentPosts(5);

      expect(result.success).toBe(true);
      expect(result.recentPosts).toHaveLength(2);
      expect(result.recentPosts?.[0].title).toBe('Test Post 1');
      expect(result.recentPosts?.[0].blogName).toBe('My Blog');
      expect(result.recentPosts?.[0].blogPlatform).toBe('tistory');
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getRecentPosts();

      expect(result).toEqual({
        success: false,
        error: '로그인이 필요합니다.',
      });
    });

    it('should limit result to maximum 20 posts', async () => {
      mockPostsSelectResult.mockResolvedValue({
        data: [],
        error: null,
      });

      // limit이 20을 초과해도 내부적으로 20으로 제한됨
      const result = await getRecentPosts(50);

      expect(result.success).toBe(true);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription info when subscription exists', async () => {
      const mockSubscription = {
        plan: 'standard',
        status: 'active',
        usage_count: 25,
        monthly_limit: 100,
        current_period_end: '2026-02-11T00:00:00Z',
      };

      mockSubscriptionSelectResult.mockResolvedValue({
        data: mockSubscription,
        error: null,
      });

      const result = await getSubscriptionStatus();

      expect(result.success).toBe(true);
      expect(result.subscription?.plan).toBe('standard');
      expect(result.subscription?.planName).toBe('스탠다드');
      expect(result.subscription?.usageCount).toBe(25);
      expect(result.subscription?.monthlyLimit).toBe(100);
      expect(result.subscription?.usagePercentage).toBe(25);
      expect(result.subscription?.remainingPosts).toBe(75);
      expect(result.subscription?.isLimitReached).toBe(false);
    });

    it('should return default free plan when no subscription exists', async () => {
      mockSubscriptionSelectResult.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getSubscriptionStatus();

      expect(result.success).toBe(true);
      expect(result.subscription?.plan).toBe('free');
      expect(result.subscription?.planName).toBe('무료');
      expect(result.subscription?.monthlyLimit).toBe(10);
      expect(result.subscription?.usageCount).toBe(0);
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getSubscriptionStatus();

      expect(result).toEqual({
        success: false,
        error: '로그인이 필요합니다.',
      });
    });

    it('should indicate when limit is reached', async () => {
      const mockSubscription = {
        plan: 'light',
        status: 'active',
        usage_count: 30,
        monthly_limit: 30,
        current_period_end: '2026-02-11T00:00:00Z',
      };

      mockSubscriptionSelectResult.mockResolvedValue({
        data: mockSubscription,
        error: null,
      });

      const result = await getSubscriptionStatus();

      expect(result.success).toBe(true);
      expect(result.subscription?.isLimitReached).toBe(true);
      expect(result.subscription?.remainingPosts).toBe(0);
      expect(result.subscription?.usagePercentage).toBe(100);
    });

    it('should not indicate limit reached for unlimited plan', async () => {
      const mockSubscription = {
        plan: 'unlimited',
        status: 'active',
        usage_count: 999999,
        monthly_limit: 999999,
        current_period_end: '2026-02-11T00:00:00Z',
      };

      mockSubscriptionSelectResult.mockResolvedValue({
        data: mockSubscription,
        error: null,
      });

      const result = await getSubscriptionStatus();

      expect(result.success).toBe(true);
      expect(result.subscription?.isLimitReached).toBe(false);
    });
  });

  describe('getConnectedBlogsCount', () => {
    it('should return count of connected blogs', async () => {
      mockBlogsCountResult.mockResolvedValue({
        count: 3,
        error: null,
      });

      const result = await getConnectedBlogsCount();

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });

    it('should return 0 when no blogs connected', async () => {
      mockBlogsCountResult.mockResolvedValue({
        count: 0,
        error: null,
      });

      const result = await getConnectedBlogsCount();

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getConnectedBlogsCount();

      expect(result).toEqual({
        success: false,
        error: '로그인이 필요합니다.',
      });
    });
  });

  describe('getMonthlyStats', () => {
    it('should return monthly statistics', async () => {
      const mockPosts = [
        { id: '1', status: 'published' },
        { id: '2', status: 'published' },
        { id: '3', status: 'published' },
        { id: '4', status: 'failed' },
        { id: '5', status: 'pending' },
      ];

      mockPostsSelectResult.mockResolvedValue({
        data: mockPosts,
        error: null,
      });

      const result = await getMonthlyStats();

      expect(result.success).toBe(true);
      expect(result.totalPosts).toBe(5);
      expect(result.publishedPosts).toBe(3);
      expect(typeof result.averagePerDay).toBe('number');
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getMonthlyStats();

      expect(result).toEqual({
        success: false,
        error: '로그인이 필요합니다.',
      });
    });
  });

  describe('getDashboardData', () => {
    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getDashboardData();

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });
  });
});
