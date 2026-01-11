/**
 * @jest-environment node
 */

import { GET } from '@/app/api/payment/history/route';
import { NextRequest } from 'next/server';
import { PLAN_NAMES } from '@/lib/constants/plans';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock payment data
const mockPayments = [
  {
    id: 'pay-1',
    payment_key: 'pk_123',
    order_id: 'morav_pro_123_user-123',
    amount: 69000,
    plan: 'pro',
    status: 'completed',
    method: '카드',
    card_company: '삼성카드',
    card_number: '****1234',
    receipt_url: 'https://receipt.example.com/1',
    cancelled_at: null,
    cancel_reason: null,
    created_at: '2026-01-10T12:00:00Z',
  },
  {
    id: 'pay-2',
    payment_key: 'pk_456',
    order_id: 'morav_standard_456_user-123',
    amount: 39000,
    plan: 'standard',
    status: 'cancelled',
    method: '카드',
    card_company: '신한카드',
    card_number: '****5678',
    receipt_url: 'https://receipt.example.com/2',
    cancelled_at: '2026-01-05T15:00:00Z',
    cancel_reason: '서비스 불만족',
    created_at: '2026-01-01T10:00:00Z',
  },
];

// Mock functions
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockReturnValue({
              range: mockRange,
            }),
            eq: mockEq,
          }),
        }),
      })),
    })
  ),
}));

describe('Payment History API - GET /api/payment/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return payment history successfully', async () => {
    mockRange.mockResolvedValueOnce({
      data: mockPayments,
      error: null,
      count: 2,
    });

    const request = new NextRequest('http://localhost:3000/api/payment/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.payments).toHaveLength(2);
    expect(data.payments[0].planName).toBe(PLAN_NAMES.pro);
    expect(data.payments[0].statusText).toBe('결제완료');
    expect(data.payments[1].statusText).toBe('취소됨');
  });

  it('should return empty list when no payments', async () => {
    mockRange.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/payment/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.payments).toHaveLength(0);
    expect(data.pagination.total).toBe(0);
  });

  it('should handle pagination', async () => {
    mockRange.mockResolvedValueOnce({
      data: [mockPayments[0]],
      error: null,
      count: 2,
    });

    const request = new NextRequest('http://localhost:3000/api/payment/history?page=1&limit=1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.payments).toHaveLength(1);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(1);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.totalPages).toBe(2);
  });

  it('should include all payment details', async () => {
    mockRange.mockResolvedValueOnce({
      data: [mockPayments[0]],
      error: null,
      count: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/payment/history');
    const response = await GET(request);
    const data = await response.json();

    const payment = data.payments[0];
    expect(payment.paymentKey).toBe('pk_123');
    expect(payment.orderId).toBe('morav_pro_123_user-123');
    expect(payment.amount).toBe(69000);
    expect(payment.plan).toBe('pro');
    expect(payment.method).toBe('카드');
    expect(payment.cardCompany).toBe('삼성카드');
    expect(payment.cardNumber).toBe('****1234');
    expect(payment.receiptUrl).toBe('https://receipt.example.com/1');
  });

  it('should include cancellation details for cancelled payments', async () => {
    mockRange.mockResolvedValueOnce({
      data: [mockPayments[1]],
      error: null,
      count: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/payment/history');
    const response = await GET(request);
    const data = await response.json();

    const payment = data.payments[0];
    expect(payment.status).toBe('cancelled');
    expect(payment.cancelledAt).toBe('2026-01-05T15:00:00Z');
    expect(payment.cancelReason).toBe('서비스 불만족');
  });

  it('should handle database error', async () => {
    mockRange.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
      count: null,
    });

    const request = new NextRequest('http://localhost:3000/api/payment/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('결제 내역 조회');
  });
});
