/**
 * @jest-environment node
 */

import { signup, login, logout, resetPassword, updatePassword } from '@/lib/actions/auth';

// Mock Supabase client
const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        signUp: mockSignUp,
        signInWithPassword: mockSignInWithPassword,
        signOut: mockSignOut,
        resetPasswordForEmail: mockResetPasswordForEmail,
        updateUser: mockUpdateUser,
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

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should sign up a user with email and password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSignUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const result = await signup(formData);

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({ success: true, user: mockUser });
    });

    it('should return error for invalid email', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('password', 'password123');

      const result = await signup(formData);

      expect(result).toEqual({
        success: false,
        error: '유효한 이메일 주소를 입력해주세요.',
      });
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should return error for short password', async () => {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', '123');

      const result = await signup(formData);

      expect(result).toEqual({
        success: false,
        error: '비밀번호는 최소 6자 이상이어야 합니다.',
      });
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should return error when signup fails', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const result = await signup(formData);

      expect(result).toEqual({
        success: false,
        error: 'User already registered',
      });
    });
  });

  describe('login', () => {
    it('should log in a user with email and password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const result = await login(formData);

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({ success: true, user: mockUser });
    });

    it('should return error for invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'wrongpassword');

      const result = await login(formData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid login credentials',
      });
    });

    it('should return error for missing email', async () => {
      const formData = new FormData();
      formData.append('password', 'password123');

      const result = await login(formData);

      expect(result).toEqual({
        success: false,
        error: '이메일을 입력해주세요.',
      });
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should log out a user', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const result = await logout();

      expect(mockSignOut).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should return error when logout fails', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      const result = await logout();

      expect(result).toEqual({
        success: false,
        error: 'Logout failed',
      });
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');

      const result = await resetPassword(formData);

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/auth/reset/confirm'),
      });
      expect(result).toEqual({ success: true });
    });

    it('should return error for invalid email', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');

      const result = await resetPassword(formData);

      expect(result).toEqual({
        success: false,
        error: '유효한 이메일 주소를 입력해주세요.',
      });
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const formData = new FormData();
      formData.append('password', 'newpassword123');

      const result = await updatePassword(formData);

      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
      expect(result).toEqual({ success: true });
    });

    it('should return error for short password', async () => {
      const formData = new FormData();
      formData.append('password', '123');

      const result = await updatePassword(formData);

      expect(result).toEqual({
        success: false,
        error: '비밀번호는 최소 6자 이상이어야 합니다.',
      });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });
});
