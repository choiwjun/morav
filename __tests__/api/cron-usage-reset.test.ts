/**
 * @jest-environment node
 */

import { POST, GET } from '@/app/api/cron/usage-reset/route';
import { NextRequest } from 'next/server';

// Mock resetMonthlyUsage
const mockResetMonthlyUsage = jest.fn();

jest.mock('@/lib/subscription', () => ({
  resetMonthlyUsage: () => mockResetMonthlyUsage(),
}));

describe('Usage Reset Cron API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/cron/usage-reset', () => {
    it('should reset usage successfully without auth when no secret is set', async () => {
      mockResetMonthlyUsage.mockResolvedValueOnce({
        success: true,
        resetCount: 5,
        errors: [],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/usage-reset', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resetCount).toBe(5);
    });

    it('should require auth when CRON_SECRET is set', async () => {
      process.env.CRON_SECRET = 'test-secret';

      const request = new NextRequest('http://localhost:3000/api/cron/usage-reset', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should allow request with correct auth header', async () => {
      process.env.CRON_SECRET = 'test-secret';
      mockResetMonthlyUsage.mockResolvedValueOnce({
        success: true,
        resetCount: 3,
        errors: [],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/usage-reset', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resetCount).toBe(3);
    });

    it('should handle reset failure', async () => {
      mockResetMonthlyUsage.mockResolvedValueOnce({
        success: false,
        resetCount: 0,
        errors: ['Database error'],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/usage-reset', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return partial success with errors', async () => {
      mockResetMonthlyUsage.mockResolvedValueOnce({
        success: true,
        resetCount: 8,
        errors: ['Sub 1: error', 'Sub 2: error'],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/usage-reset', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resetCount).toBe(8);
      expect(data.errors).toHaveLength(2);
    });
  });

  describe('GET /api/cron/usage-reset', () => {
    it('should work the same as POST', async () => {
      mockResetMonthlyUsage.mockResolvedValueOnce({
        success: true,
        resetCount: 2,
        errors: [],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/usage-reset', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
