/**
 * @jest-environment node
 */

import { GET } from '@/app/api/subscription/route';
import { PLAN_LIMITS, PLAN_NAMES, PLAN_POSTS_DISPLAY } from '@/lib/constants/plans';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock subscription data
const mockSubscription = {
  id: 'sub-123',
  userId: 'user-123',
  plan: 'standard',
  status: 'active',
  monthlyLimit: PLAN_LIMITS.standard,
  usageCount: 25,
  currentPeriodStart: '2026-01-01T00:00:00Z',
  currentPeriodEnd: '2026-01-31T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// Mock getUserSubscription
const mockGetUserSubscription = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    })
  ),
}));

jest.mock('@/lib/subscription', () => ({
  getUserSubscription: () => mockGetUserSubscription(),
}));

describe('Subscription API - GET /api/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return subscription details successfully', async () => {
    mockGetUserSubscription.mockResolvedValueOnce({
      success: true,
      subscription: mockSubscription,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.subscription).toBeDefined();
    expect(data.subscription.plan).toBe('standard');
    expect(data.subscription.planName).toBe(PLAN_NAMES.standard);
    expect(data.subscription.status).toBe('active');
    expect(data.subscription.monthlyLimit).toBe(PLAN_LIMITS.standard);
    expect(data.subscription.usageCount).toBe(25);
    expect(data.subscription.remainingPosts).toBe(PLAN_LIMITS.standard - 25);
    expect(data.subscription.postsDisplay).toBe(PLAN_POSTS_DISPLAY.standard);
  });

  it('should return error when subscription not found', async () => {
    mockGetUserSubscription.mockResolvedValueOnce({
      success: false,
      error: '구독 정보를 찾을 수 없습니다.',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('구독 정보');
  });

  it('should return free plan subscription', async () => {
    mockGetUserSubscription.mockResolvedValueOnce({
      success: true,
      subscription: {
        ...mockSubscription,
        plan: 'free',
        monthlyLimit: PLAN_LIMITS.free,
        usageCount: 5,
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.subscription.plan).toBe('free');
    expect(data.subscription.planName).toBe(PLAN_NAMES.free);
    expect(data.subscription.remainingPosts).toBe(PLAN_LIMITS.free - 5);
  });

  it('should return unlimited plan with correct display', async () => {
    mockGetUserSubscription.mockResolvedValueOnce({
      success: true,
      subscription: {
        ...mockSubscription,
        plan: 'unlimited',
        monthlyLimit: PLAN_LIMITS.unlimited,
        usageCount: 500,
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.subscription.plan).toBe('unlimited');
    expect(data.subscription.planName).toBe(PLAN_NAMES.unlimited);
    expect(data.subscription.postsDisplay).toBe(PLAN_POSTS_DISPLAY.unlimited);
  });
});
