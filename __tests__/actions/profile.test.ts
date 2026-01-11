/**
 * @jest-environment node
 */

import { getProfile, updateProfile } from '@/lib/actions/profile';

// Mock Supabase client
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
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

describe('Profile Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup chain mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await getProfile();

      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toEqual({ success: true, profile: mockProfile });
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getProfile();

      expect(result).toEqual({
        success: false,
        error: '인증되지 않은 사용자입니다.',
      });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return error when profile fetch fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      const result = await getProfile();

      expect(result).toEqual({
        success: false,
        error: 'Profile not found',
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user name', async () => {
      const mockUser = { id: 'user-123' };
      const mockUpdatedProfile = {
        id: 'user-123',
        name: 'Updated Name',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      const formData = new FormData();
      formData.append('name', 'Updated Name');

      const result = await updateProfile(formData);

      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Name',
        updated_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toEqual({ success: true, profile: mockUpdatedProfile });
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const formData = new FormData();
      formData.append('name', 'Updated Name');

      const result = await updateProfile(formData);

      expect(result).toEqual({
        success: false,
        error: '인증되지 않은 사용자입니다.',
      });
    });

    it('should update avatar_url', async () => {
      const mockUser = { id: 'user-123' };
      const mockUpdatedProfile = {
        id: 'user-123',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      const formData = new FormData();
      formData.append('avatar_url', 'https://example.com/avatar.jpg');

      const result = await updateProfile(formData);

      expect(mockUpdate).toHaveBeenCalledWith({
        avatar_url: 'https://example.com/avatar.jpg',
        updated_at: expect.any(String),
      });
      expect(result).toEqual({ success: true, profile: mockUpdatedProfile });
    });

    it('should return error when update fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const formData = new FormData();
      formData.append('name', 'Updated Name');

      const result = await updateProfile(formData);

      expect(result).toEqual({
        success: false,
        error: 'Update failed',
      });
    });
  });
});
