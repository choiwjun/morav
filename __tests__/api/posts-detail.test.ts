/**
 * @jest-environment node
 */

import { GET, DELETE } from '@/app/api/posts/[id]/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockPostsSelect = jest.fn();
const mockPostsDelete = jest.fn();

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
              })),
            })),
            delete: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: mockPostsDelete,
              })),
            })),
          };
        }
        return {};
      }),
    })
  ),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: jest.fn(() => []),
      set: jest.fn(),
      get: jest.fn(),
    })
  ),
}));

describe('Posts Detail API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/posts/[id]', () => {
    it('should return post detail successfully', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          title: '테스트 포스트',
          content: '본문 내용',
          status: 'published',
          published_url: 'https://blog.com/post-1',
          scheduled_at: null,
          published_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          retry_count: 0,
          error_message: null,
          blogs: {
            id: 'blog-1',
            blog_name: '내 블로그',
            platform: 'tistory',
            blog_url: 'https://myblog.tistory.com',
          },
          keywords: [{ keyword: '키워드1' }],
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/posts/post-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'post-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.post.id).toBe('post-1');
      expect(data.post.title).toBe('테스트 포스트');
      expect(data.post.blog.name).toBe('내 블로그');
      expect(data.post.keyword).toBe('키워드1');
    });

    it('should return 404 when post not found', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const request = new NextRequest('http://localhost:3000/api/posts/invalid-id');
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return null keyword when no keywords', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          title: '테스트 포스트',
          content: '본문',
          status: 'generated',
          published_url: null,
          scheduled_at: null,
          published_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          retry_count: 0,
          error_message: null,
          blogs: {
            id: 'blog-1',
            blog_name: '내 블로그',
            platform: 'tistory',
            blog_url: 'https://myblog.tistory.com',
          },
          keywords: [],
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/posts/post-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'post-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.post.keyword).toBeNull();
    });
  });

  describe('DELETE /api/posts/[id]', () => {
    it('should delete post successfully', async () => {
      mockPostsDelete.mockResolvedValueOnce({
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/posts/post-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'post-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('삭제');
    });

    it('should handle delete error', async () => {
      mockPostsDelete.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/posts/post-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'post-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
