/**
 * @jest-environment node
 */

import { signInWithGoogle, handleOAuthCallback } from '@/lib/actions/oauth';

// Mock Supabase client
const mockSignInWithOAuth = jest.fn();
const mockExchangeCodeForSession = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        signInWithOAuth: mockSignInWithOAuth,
        exchangeCodeForSession: mockExchangeCodeForSession,
        getUser: mockGetUser,
      },
    })
  ),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

describe('OAuth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('should return Google OAuth URL', async () => {
      const mockUrl = 'https://accounts.google.com/oauth?client_id=xxx';

      mockSignInWithOAuth.mockResolvedValue({
        data: { url: mockUrl },
        error: null,
      });

      const result = await signInWithGoogle();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      });
      expect(result).toEqual({ success: true, url: mockUrl });
    });

    it('should return error when OAuth fails', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: { message: 'OAuth configuration error' },
      });

      const result = await signInWithGoogle();

      expect(result).toEqual({
        success: false,
        error: 'OAuth configuration error',
      });
    });
  });

  describe('handleOAuthCallback', () => {
    it('should exchange code for session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@gmail.com',
      };

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      const result = await handleOAuthCallback('auth-code-123');

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('auth-code-123');
      expect(result).toEqual({ success: true, user: mockUser });
    });

    it('should return error for invalid code', async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid auth code' },
      });

      const result = await handleOAuthCallback('invalid-code');

      expect(result).toEqual({
        success: false,
        error: 'Invalid auth code',
      });
    });

    it('should return error when code is missing', async () => {
      const result = await handleOAuthCallback('');

      expect(result).toEqual({
        success: false,
        error: '인증 코드가 없습니다.',
      });
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });
  });
});
