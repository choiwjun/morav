/**
 * @jest-environment node
 */

import { POST } from '@/app/api/payment/confirm/route';
import { NextRequest } from 'next/server';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock upgradePlan
const mockUpgradePlan = jest.fn();

jest.mock('@/lib/subscription', () => ({
  upgradePlan: (userId: string, planId: string) => mockUpgradePlan(userId, planId),
  PlanType: {},
}));

// Mock Supabase
const mockInsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn(() => ({
        insert: mockInsert.mockResolvedValue({ error: null }),
      })),
    })
  ),
}));

describe('Payment Confirm API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, TOSS_SECRET_KEY: 'test_secret_key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should confirm payment and create subscription', async () => {
    // Mock Toss payment confirmation success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          paymentKey: 'test-payment-key',
          orderId: 'morav_light_12345678_user-123',
          status: 'DONE',
          totalAmount: 19000,
          method: '카드',
          approvedAt: '2026-01-11T12:00:00Z',
          receipt: { url: 'https://receipt.url' },
        }),
    });

    // Mock upgradePlan success
    mockUpgradePlan.mockResolvedValueOnce({
      success: true,
      subscription: {
        id: 'sub-123',
        plan: 'light',
        monthlyLimit: 30,
        status: 'active',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        orderId: 'morav_light_12345678_user-123',
        amount: 19000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.payment).toBeDefined();
    expect(data.payment.paymentKey).toBe('test-payment-key');
    expect(data.subscription.plan).toBe('light');
    expect(mockUpgradePlan).toHaveBeenCalledWith('user-123', 'light');
  });

  it('should return error for missing payment info', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        // missing orderId and amount
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('필수 결제 정보');
  });

  it('should return error for invalid orderId format', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        orderId: 'invalid-order-id',
        amount: 19000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('잘못된 주문 번호');
  });

  it('should return error for invalid plan', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        orderId: 'morav_invalidplan_12345678_user-123',
        amount: 19000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('유효하지 않은 플랜');
  });

  it('should handle Toss API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          failure: {
            code: 'INVALID_CARD',
            message: '카드 정보가 올바르지 않습니다.',
          },
        }),
    });

    const request = new NextRequest('http://localhost:3000/api/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        orderId: 'morav_light_12345678_user-123',
        amount: 19000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('카드 정보');
  });

  it('should handle subscription upgrade failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          paymentKey: 'test-payment-key',
          orderId: 'morav_light_12345678_user-123',
          status: 'DONE',
          totalAmount: 19000,
          method: '카드',
          approvedAt: '2026-01-11T12:00:00Z',
        }),
    });

    mockUpgradePlan.mockResolvedValueOnce({
      success: false,
      error: 'Database error',
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new NextRequest('http://localhost:3000/api/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        orderId: 'morav_light_12345678_user-123',
        amount: 19000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('구독 활성화');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return error when TOSS_SECRET_KEY is not set', async () => {
    process.env.TOSS_SECRET_KEY = '';

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new NextRequest('http://localhost:3000/api/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        orderId: 'morav_light_12345678_user-123',
        amount: 19000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('결제 설정');

    consoleErrorSpy.mockRestore();
  });
});
