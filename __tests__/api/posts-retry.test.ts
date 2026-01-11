/**
 * @jest-environment node
 */

import { POST } from '@/app/api/posts/[id]/retry/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockPostsSelect = jest.fn();
const mockPostsUpdate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn((table: string) => {
        if (table === 'posts') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: mockPostsSelect,
                })),
                single: mockPostsSelect,
              })),
            })),
            update: mockPostsUpdate,
          };
        }
        return {};
      }),
    })
  ),
}));

// Mock retryFailedPost
jest.mock('@/lib/blog', () => ({
  retryFailedPost: jest.fn(),
}));

import { retryFailedPost } from '@/lib/blog';

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: jest.fn(() => []),
      set: jest.fn(),
      get: jest.fn(),
    })
  ),
}));

describe('Posts Retry API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/posts/[id]/retry', () => {
    it('should retry failed post successfully', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          status: 'failed',
          user_id: 'user-123',
        },
        error: null,
      });

      (retryFailedPost as jest.Mock).mockResolvedValueOnce({
        success: true,
        postUrl: 'https://blog.com/new-post',
      });

      const request = new NextRequest('http://localhost:3000/api/posts/post-1/retry', {
        method: 'POST',
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'post-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.postUrl).toBe('https://blog.com/new-post');
    });

    it('should return error when post is not failed', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          status: 'published',
          user_id: 'user-123',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/posts/post-1/retry', {
        method: 'POST',
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'post-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('실패한 포스트만');
    });

    it('should return error when post not found', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const request = new NextRequest('http://localhost:3000/api/posts/invalid-id/retry', {
        method: 'POST',
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return error when user does not own post', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          status: 'failed',
          user_id: 'other-user', // 다른 사용자
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/posts/post-1/retry', {
        method: 'POST',
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'post-1' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('권한');
    });

    it('should handle retry failure', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          status: 'failed',
          user_id: 'user-123',
        },
        error: null,
      });

      (retryFailedPost as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'API 오류',
      });

      const request = new NextRequest('http://localhost:3000/api/posts/post-1/retry', {
        method: 'POST',
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'post-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('API 오류');
    });
  });
});
