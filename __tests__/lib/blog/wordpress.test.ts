/**
 * @jest-environment node
 */

import { publishToWordPress, getWordPressCategories, updateWordPressPost } from '@/lib/blog/wordpress';
import { PublishParams, BlogCredentials } from '@/lib/blog/types';

// Mock fetch
global.fetch = jest.fn();

describe('WordPress Publisher', () => {
  const mockCredentials: BlogCredentials = {
    accessToken: 'app-password',
    blogUrl: 'https://myblog.wordpress.com',
    username: 'testuser',
  };

  const mockParams: PublishParams = {
    title: '테스트 포스트',
    content: '# 제목\n\n본문 내용입니다.',
    category: '1',
    visibility: 'public',
  };

  const mockParamsWithTags: PublishParams = {
    ...mockParams,
    tags: ['태그1', '태그2'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publishToWordPress', () => {
    it('should return error when credentials are missing', async () => {
      const result = await publishToWordPress(mockParams, { accessToken: '', username: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('워드프레스 인증 정보가 없습니다.');
      expect(result.platform).toBe('wordpress');
    });

    it('should return error when blog URL is missing', async () => {
      const result = await publishToWordPress(mockParams, { accessToken: 'pass', username: 'user', blogUrl: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('블로그 URL이 없습니다.');
    });

    it('should publish post successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          link: 'https://myblog.wordpress.com/2024/01/test/',
          date: '2024-01-01T00:00:00',
          status: 'publish',
        }),
      });

      const result = await publishToWordPress(mockParams, mockCredentials);

      expect(result.success).toBe(true);
      expect(result.postId).toBe('123');
      expect(result.postUrl).toBe('https://myblog.wordpress.com/2024/01/test/');
      expect(result.platform).toBe('wordpress');
    });

    it('should handle API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Unauthorized',
        }),
      });

      const result = await publishToWordPress(mockParams, mockCredentials, { maxRetries: 0, baseDelay: 100, maxDelay: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should retry on server error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 456,
            link: 'https://myblog.wordpress.com/test/',
            date: '2024-01-01T00:00:00',
          }),
        });

      const result = await publishToWordPress(mockParams, mockCredentials, { maxRetries: 1, baseDelay: 10, maxDelay: 100 });

      expect(result.success).toBe(true);
      expect(result.postId).toBe('456');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should include Basic Auth header', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          link: 'https://myblog.wordpress.com/test/',
        }),
      });

      await publishToWordPress(mockParams, mockCredentials);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should publish as draft when visibility is draft', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          link: 'https://myblog.wordpress.com/draft/',
          status: 'draft',
        }),
      });

      await publishToWordPress({ ...mockParams, visibility: 'draft' }, mockCredentials);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"status":"draft"'),
        })
      );
    });

    it('should include category when numeric', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          link: 'https://myblog.wordpress.com/test/',
        }),
      });

      await publishToWordPress({ ...mockParams, category: '5' }, mockCredentials);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"categories":[5]'),
        })
      );
    });

    it('should normalize blog URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          link: 'https://myblog.wordpress.com/test/',
        }),
      });

      await publishToWordPress(mockParams, {
        ...mockCredentials,
        blogUrl: 'myblog.wordpress.com/',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://myblog.wordpress.com/wp-json'),
        expect.any(Object)
      );
    });
  });

  describe('getWordPressCategories', () => {
    it('should return error when credentials missing', async () => {
      const result = await getWordPressCategories({ accessToken: '', username: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('인증 정보가 없습니다.');
    });

    it('should fetch categories successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Uncategorized' },
          { id: 2, name: 'Tech' },
        ],
      });

      const result = await getWordPressCategories(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.categories).toHaveLength(2);
      expect(result.categories?.[1].name).toBe('Tech');
    });
  });

  describe('updateWordPressPost', () => {
    it('should update post successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          link: 'https://myblog.wordpress.com/updated/',
        }),
      });

      const result = await updateWordPressPost('123', mockParams, mockCredentials);

      expect(result.success).toBe(true);
      expect(result.postId).toBe('123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts/123'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should return error when credentials missing', async () => {
      const result = await updateWordPressPost('123', mockParams, { accessToken: '', username: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('인증 정보가 없습니다.');
    });
  });
});
