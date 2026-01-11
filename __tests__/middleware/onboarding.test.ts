/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock Supabase client
const mockGetUser = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Import after mocking
import { onboardingMiddleware } from '@/lib/middleware/onboarding';

describe('Onboarding Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('인증되지 않은 사용자 리다이렉트', () => {
    it('should redirect unauthenticated users from /onboarding to /auth/login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/onboarding/connect-blog');
      const response = await onboardingMiddleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/login');
    });

    it('should redirect unauthenticated users from /onboarding/api-key to /auth/login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/onboarding/api-key');
      const response = await onboardingMiddleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/login');
    });

    it('should redirect unauthenticated users from /onboarding/category to /auth/login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/onboarding/category');
      const response = await onboardingMiddleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/login');
    });
  });

  describe('인증된 사용자 접근 허용', () => {
    it('should allow authenticated users to access /onboarding pages', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/onboarding/connect-blog');
      const response = await onboardingMiddleware(request);

      // 인증된 사용자는 리다이렉트되지 않음
      expect(response.status).not.toBe(307);
    });
  });

  describe('비 온보딩 경로 처리', () => {
    it('should not affect non-onboarding routes', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await onboardingMiddleware(request);

      // 온보딩 경로가 아니면 그냥 통과
      expect(response.status).not.toBe(307);
    });

    it('should not affect auth routes', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/auth/login');
      const response = await onboardingMiddleware(request);

      expect(response.status).not.toBe(307);
    });
  });
});
