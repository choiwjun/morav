/**
 * @jest-environment node
 */

import { POST } from '@/app/api/subscription/cancel/route';
import { NextRequest } from 'next/server';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock functions
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

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
          }),
        }),
        update: mockUpdate.mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      })),
    })
  ),
}));

describe('Subscription Cancel API - POST /api/subscription/cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should cancel subscription successfully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'standard',
        status: 'active',
        current_period_end: '2026-01-31T00:00:00Z',
      },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ cancelReason: '서비스 불만족' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('취소');
    expect(data.subscription.status).toBe('cancelled');
  });

  it('should return error when subscription not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    const request = new NextRequest('http://localhost:3000/api/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ cancelReason: '서비스 불만족' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('찾을 수 없습니다');
  });

  it('should return error when already cancelled', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'standard',
        status: 'cancelled',
      },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ cancelReason: '서비스 불만족' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('이미 취소');
  });

  it('should return error for free plan cancellation', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'free',
        status: 'active',
      },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ cancelReason: '서비스 불만족' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('무료 플랜');
  });

  it('should include period end date in response', async () => {
    const periodEnd = '2026-02-15T00:00:00Z';
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'pro',
        status: 'active',
        current_period_end: periodEnd,
      },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ cancelReason: '서비스 불만족' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.subscription.currentPeriodEnd).toBe(periodEnd);
  });
});
