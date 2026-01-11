/**
 * @jest-environment node
 */

import { publishToTistory, getTistoryCategories } from '@/lib/blog/tistory';
import { PublishParams, BlogCredentials } from '@/lib/blog/types';

// Mock fetch
global.fetch = jest.fn();

describe('Tistory Publisher', () => {
  const mockCredentials: BlogCredentials = {
    accessToken: 'test-access-token',
    blogUrl: 'https://myblog.tistory.com',
  };

  const mockParams: PublishParams = {
    title: '테스트 포스트',
    content: '# 제목\n\n본문 내용입니다.',
    category: '일반',
    tags: ['태그1', '태그2'],
    visibility: 'public',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publishToTistory', () => {
    it('should return error when access token is missing', async () => {
      const result = await publishToTistory(mockParams, { accessToken: '', blogUrl: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('티스토리 액세스 토큰이 없습니다.');
      expect(result.platform).toBe('tistory');
    });

    it('should return error when blog URL is missing', async () => {
      const result = await publishToTistory(mockParams, { accessToken: 'token', blogUrl: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('블로그 URL이 없습니다.');
    });

    it('should publish post successfully', async () => {
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

      const result = await publishToTistory(mockParams, mockCredentials);

      expect(result.success).toBe(true);
      expect(result.postId).toBe('123');
      expect(result.postUrl).toBe('https://myblog.tistory.com/123');
      expect(result.platform).toBe('tistory');
      expect(result.publishedAt).toBeDefined();
    });

    it('should handle API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tistory: {
            status: '400',
            error_message: '잘못된 요청입니다.',
          },
        }),
      });

      const result = await publishToTistory(mockParams, mockCredentials, { maxRetries: 0, baseDelay: 100, maxDelay: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('잘못된 요청입니다.');
    });

    it('should handle HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await publishToTistory(mockParams, mockCredentials, { maxRetries: 0, baseDelay: 100, maxDelay: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });

    it('should retry on server error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            tistory: {
              status: '200',
              postId: '456',
              url: 'https://myblog.tistory.com/456',
            },
          }),
        });

      const result = await publishToTistory(mockParams, mockCredentials, { maxRetries: 1, baseDelay: 10, maxDelay: 100 });

      expect(result.success).toBe(true);
      expect(result.postId).toBe('456');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await publishToTistory(mockParams, mockCredentials, { maxRetries: 2, baseDelay: 10, maxDelay: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await publishToTistory(mockParams, mockCredentials, { maxRetries: 0, baseDelay: 100, maxDelay: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should convert visibility correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tistory: { status: '200', postId: '1' },
        }),
      });

      await publishToTistory({ ...mockParams, visibility: 'draft' }, mockCredentials);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('visibility=0'),
        })
      );
    });
  });

  describe('getTistoryCategories', () => {
    it('should return error when credentials missing', async () => {
      const result = await getTistoryCategories({ accessToken: '', blogUrl: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('인증 정보가 없습니다.');
    });

    it('should fetch categories successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tistory: {
            status: '200',
            item: {
              categories: [
                { id: '1', name: '일반' },
                { id: '2', name: '기술' },
              ],
            },
          },
        }),
      });

      const result = await getTistoryCategories(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.categories).toHaveLength(2);
      expect(result.categories?.[0].name).toBe('일반');
    });
  });
});
