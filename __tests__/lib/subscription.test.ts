/**
 * @jest-environment node
 */

import { PLAN_LIMITS } from '@/lib/constants/plans';

// Mock data
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockSubscription = {
  id: 'sub-123',
  user_id: 'user-123',
  plan: 'free',
  status: 'active',
  monthly_limit: PLAN_LIMITS.free,
  usage_count: 0,
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock functions
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockLte = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle,
            lte: mockLte.mockReturnValue({
              select: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
        insert: mockInsert.mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSubscription, error: null }),
          }),
        }),
        update: mockUpdate.mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSubscription, error: null }),
            }),
          }),
        }),
      })),
    })
  ),
}));

// Import after mocking
import {
  createFreeTrialSubscription,
  getUserSubscription,
  checkUsageLimit,
  incrementUsage,
  resetMonthlyUsage,
  upgradePlan,
} from '@/lib/subscription';

describe('Subscription Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFreeTrialSubscription', () => {
    it('should create a free trial subscription for new user', async () => {
      // No existing subscription
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await createFreeTrialSubscription('user-123');

      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(result.subscription?.plan).toBe('free');
      expect(result.subscription?.monthlyLimit).toBe(PLAN_LIMITS.free);
    });

    it('should return error if subscription already exists', async () => {
      // Existing subscription
      mockSingle.mockResolvedValueOnce({ data: mockSubscription, error: null });

      const result = await createFreeTrialSubscription('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('이미 구독이 존재합니다.');
    });
  });

  describe('getUserSubscription', () => {
    it('should return existing subscription', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockSubscription, error: null });

      const result = await getUserSubscription('user-123');

      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
    });

    it('should create free subscription if none exists', async () => {
      // No subscription found
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      // For createFreeTrialSubscription - no existing
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await getUserSubscription('user-123');

      expect(result.success).toBe(true);
      expect(result.subscription?.plan).toBe('free');
    });
  });

  describe('checkUsageLimit', () => {
    it('should allow publishing when under limit', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { ...mockSubscription, usage_count: 5, monthly_limit: 10 },
        error: null,
      });

      const result = await checkUsageLimit('user-123');

      expect(result.success).toBe(true);
      expect(result.canPublish).toBe(true);
      expect(result.remainingPosts).toBe(5);
    });

    it('should block publishing when limit reached', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { ...mockSubscription, usage_count: 10, monthly_limit: 10 },
        error: null,
      });

      const result = await checkUsageLimit('user-123');

      expect(result.success).toBe(true);
      expect(result.canPublish).toBe(false);
      expect(result.remainingPosts).toBe(0);
    });

    it('should always allow unlimited plan', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { ...mockSubscription, plan: 'unlimited', usage_count: 1000, monthly_limit: 999999 },
        error: null,
      });

      const result = await checkUsageLimit('user-123');

      expect(result.success).toBe(true);
      expect(result.canPublish).toBe(true);
    });

    it('should block inactive subscription', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { ...mockSubscription, status: 'cancelled' },
        error: null,
      });

      const result = await checkUsageLimit('user-123');

      expect(result.success).toBe(true);
      expect(result.canPublish).toBe(false);
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { ...mockSubscription, usage_count: 5, monthly_limit: 10 },
        error: null,
      });

      const result = await incrementUsage('user-123');

      expect(result.success).toBe(true);
      expect(result.newCount).toBe(6);
    });

    it('should fail when limit reached', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { ...mockSubscription, usage_count: 10, monthly_limit: 10 },
        error: null,
      });

      const result = await incrementUsage('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('월간 발행 한도에 도달했습니다.');
    });
  });

  describe('resetMonthlyUsage', () => {
    it('should reset usage for expired subscriptions', async () => {
      // This test verifies the function structure
      const result = await resetMonthlyUsage();

      // With empty list, should succeed with 0 reset
      expect(result.success).toBe(true);
      expect(typeof result.resetCount).toBe('number');
    });
  });

  describe('upgradePlan', () => {
    it('should upgrade plan to new tier', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockSubscription, error: null });

      const result = await upgradePlan('user-123', 'standard');

      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
    });

    it('should create subscription if none exists', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await upgradePlan('user-123', 'pro');

      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
    });
  });
});
