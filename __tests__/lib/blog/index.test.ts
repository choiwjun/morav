/**
 * @jest-environment node
 */

import { publishPost, publishAndUpdatePost, retryFailedPost } from '@/lib/blog';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockBlogsSelect = jest.fn();
const mockPostsSelect = jest.fn();
const mockPostsUpdate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn((table: string) => {
        if (table === 'blogs') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: mockBlogsSelect,
                  })),
                })),
              })),
            })),
          };
        }
        if (table === 'posts') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: mockPostsSelect,
                })),
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

jest.mock('@/lib/crypto', () => ({
  decrypt: jest.fn((encrypted: string) => `decrypted-${encrypted}`),
  encrypt: jest.fn((plain: string) => `encrypted-${plain}`),
}));

// Mock subscription module
jest.mock('@/lib/subscription', () => ({
  checkUsageLimit: jest.fn().mockResolvedValue({
    success: true,
    canPublish: true,
    usageCount: 0,
    monthlyLimit: 10,
    remainingPosts: 10,
  }),
  incrementUsage: jest.fn().mockResolvedValue({
    success: true,
    newCount: 1,
  }),
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

describe('Blog Publisher Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostsUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('publishPost', () => {
    it('should publish to Tistory successfully', async () => {
      mockBlogsSelect.mockResolvedValueOnce({
        data: {
          id: 'blog-1',
          platform: 'tistory',
          blog_url: 'https://myblog.tistory.com',
          access_token: 'encrypted-token',
          is_active: true,
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tistory: {
            status: '200',
            postId: '123',
            url: 'https://myblog.tistory.com/123',
          },
        }),
      });

      const result = await publishPost('blog-1', {
        title: '테스트',
        content: '본문',
      });

      expect(result.success).toBe(true);
      expect(result.platform).toBe('tistory');
      expect(result.postUrl).toContain('tistory.com');
    });

    it('should publish to Blogger successfully', async () => {
      mockBlogsSelect.mockResolvedValueOnce({
        data: {
          id: 'blog-2',
          platform: 'blogger',
          external_blog_id: 'blogger-123',
          access_token: 'encrypted-token',
          is_active: true,
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          kind: 'blogger#post',
          id: 'post-456',
          url: 'https://myblog.blogspot.com/test',
        }),
      });

      const result = await publishPost('blog-2', {
        title: '테스트',
        content: '본문',
      });

      expect(result.success).toBe(true);
      expect(result.platform).toBe('blogger');
    });

    it('should publish to WordPress successfully', async () => {
      mockBlogsSelect.mockResolvedValueOnce({
        data: {
          id: 'blog-3',
          platform: 'wordpress',
          blog_url: 'https://myblog.wordpress.com',
          access_token: 'encrypted-token',
          username: 'testuser',
          is_active: true,
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 789,
          link: 'https://myblog.wordpress.com/test/',
        }),
      });

      const result = await publishPost('blog-3', {
        title: '테스트',
        content: '본문',
      });

      expect(result.success).toBe(true);
      expect(result.platform).toBe('wordpress');
    });

    it('should return error when blog not found', async () => {
      mockBlogsSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await publishPost('invalid-blog', {
        title: '테스트',
        content: '본문',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('블로그를 찾을 수 없습니다');
    });
  });

  describe('publishAndUpdatePost', () => {
    it('should publish and update post status', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          blog_id: 'blog-1',
          title: '테스트',
          content: '본문',
          status: 'generated',
          retry_count: 0,
        },
        error: null,
      });

      mockBlogsSelect.mockResolvedValueOnce({
        data: {
          id: 'blog-1',
          platform: 'tistory',
          blog_url: 'https://myblog.tistory.com',
          access_token: 'encrypted-token',
          is_active: true,
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tistory: {
            status: '200',
            postId: '123',
            url: 'https://myblog.tistory.com/123',
          },
        }),
      });

      const result = await publishAndUpdatePost('post-1');

      expect(result.success).toBe(true);
      expect(result.postUrl).toBeDefined();
      expect(mockPostsUpdate).toHaveBeenCalled();
    });

    it('should return error when post not found', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await publishAndUpdatePost('invalid-post');

      expect(result.success).toBe(false);
      expect(result.error).toContain('찾을 수 없습니다');
    });

    it('should return error when already published', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          status: 'published',
        },
        error: null,
      });

      const result = await publishAndUpdatePost('post-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('이미 발행');
    });
  });

  describe('retryFailedPost', () => {
    it('should retry failed post', async () => {
      mockPostsSelect
        .mockResolvedValueOnce({
          data: {
            id: 'post-1',
            status: 'failed',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'post-1',
            blog_id: 'blog-1',
            title: '테스트',
            content: '본문',
            status: 'generated',
            retry_count: 0,
          },
          error: null,
        });

      mockBlogsSelect.mockResolvedValueOnce({
        data: {
          id: 'blog-1',
          platform: 'tistory',
          blog_url: 'https://myblog.tistory.com',
          access_token: 'encrypted-token',
          is_active: true,
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tistory: {
            status: '200',
            postId: '123',
            url: 'https://myblog.tistory.com/123',
          },
        }),
      });

      const result = await retryFailedPost('post-1');

      expect(result.success).toBe(true);
    });

    it('should return error when post is not failed', async () => {
      mockPostsSelect.mockResolvedValueOnce({
        data: {
          id: 'post-1',
          status: 'published',
        },
        error: null,
      });

      const result = await retryFailedPost('post-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('실패한 포스트만');
    });
  });
});
