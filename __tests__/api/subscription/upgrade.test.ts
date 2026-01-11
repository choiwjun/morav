/**
 * @jest-environment node
 */

import { POST } from '@/app/api/subscription/upgrade/route';
import { NextRequest } from 'next/server';
import { PLAN_LIMITS, PLAN_NAMES } from '@/lib/constants/plans';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock upgradePlan
const mockUpgradePlan = jest.fn();

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
  upgradePlan: (userId: string, plan: string) => mockUpgradePlan(userId, plan),
  PlanType: {},
}));

describe('Subscription Upgrade API - POST /api/subscription/upgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upgrade plan successfully', async () => {
    mockUpgradePlan.mockResolvedValueOnce({
      success: true,
      subscription: {
        id: 'sub-123',
        userId: 'user-123',
        plan: 'pro',
        status: 'active',
        monthlyLimit: PLAN_LIMITS.pro,
        usageCount: 0,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain(PLAN_NAMES.pro);
    expect(data.subscription.plan).toBe('pro');
    expect(data.subscription.monthlyLimit).toBe(PLAN_LIMITS.pro);
  });

  it('should return error for missing plan', async () => {
    const request = new NextRequest('http://localhost:3000/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('플랜');
  });

  it('should return error for invalid plan', async () => {
    const request = new NextRequest('http://localhost:3000/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan: 'invalid_plan' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('유효하지 않은');
  });

  it('should handle upgrade failure', async () => {
    mockUpgradePlan.mockResolvedValueOnce({
      success: false,
      error: '플랜 업그레이드에 실패했습니다.',
    });

    const request = new NextRequest('http://localhost:3000/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan: 'standard' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('실패');
  });

  it('should upgrade from free to light', async () => {
    mockUpgradePlan.mockResolvedValueOnce({
      success: true,
      subscription: {
        id: 'sub-123',
        userId: 'user-123',
        plan: 'light',
        status: 'active',
        monthlyLimit: PLAN_LIMITS.light,
        usageCount: 0,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan: 'light' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.subscription.plan).toBe('light');
    expect(data.subscription.planName).toBe(PLAN_NAMES.light);
  });
});
