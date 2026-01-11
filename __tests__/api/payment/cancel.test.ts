/**
 * @jest-environment node
 */

import { POST } from '@/app/api/payment/cancel/route';
import { NextRequest } from 'next/server';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Supabase
const mockUpdate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn(() => ({
        update: mockUpdate.mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      })),
    })
  ),
}));

describe('Payment Cancel API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, TOSS_SECRET_KEY: 'test_secret_key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should cancel payment successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          paymentKey: 'test-payment-key',
          cancels: [
            {
              cancelAmount: 19000,
              canceledAt: '2026-01-11T12:00:00Z',
            },
          ],
        }),
    });

    const request = new NextRequest('http://localhost:3000/api/payment/cancel', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        cancelReason: '고객 요청에 의한 취소',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('결제가 취소되었습니다.');
    expect(data.cancellation.cancelAmount).toBe(19000);
  });

  it('should cancel partial amount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          paymentKey: 'test-payment-key',
          cancels: [
            {
              cancelAmount: 10000,
              canceledAt: '2026-01-11T12:00:00Z',
            },
          ],
        }),
    });

    const request = new NextRequest('http://localhost:3000/api/payment/cancel', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        cancelReason: '부분 환불',
        cancelAmount: 10000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return error for missing info', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/cancel', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        // missing cancelReason
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('필수 정보');
  });

  it('should handle Toss API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          code: 'ALREADY_CANCELED',
          message: '이미 취소된 결제입니다.',
        }),
    });

    const request = new NextRequest('http://localhost:3000/api/payment/cancel', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        cancelReason: '취소 사유',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('이미 취소');
  });

  it('should return error when TOSS_SECRET_KEY is not set', async () => {
    process.env.TOSS_SECRET_KEY = '';

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new NextRequest('http://localhost:3000/api/payment/cancel', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey: 'test-payment-key',
        cancelReason: '취소 사유',
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
