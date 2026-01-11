/**
 * @jest-environment node
 */

import { publishToBlogger, updateBloggerPost } from '@/lib/blog/blogger';
import { PublishParams, BlogCredentials } from '@/lib/blog/types';

// Mock fetch
global.fetch = jest.fn();

describe('Blogger Publisher', () => {
  const mockCredentials: BlogCredentials = {
    accessToken: 'test-access-token',
    blogId: 'blog-123',
  };

  const mockParams: PublishParams = {
    title: '테스트 포스트',
    content: '# 제목\n\n본문 내용입니다.',
    tags: ['태그1', '태그2'],
    visibility: 'public',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publishToBlogger', () => {
    it('should return error when access token is missing', async () => {
      const result = await publishToBlogger(mockParams, { accessToken: '', blogId: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('블로거 액세스 토큰이 없습니다.');
      expect(result.platform).toBe('blogger');
    });

    it('should return error when blog ID is missing', async () => {
      const result = await publishToBlogger(mockParams, { accessToken: 'token', blogId: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('블로그 ID가 없습니다.');
    });

    it('should publish post successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          kind: 'blogger#post',
          id: 'post-123',
          url: 'https://myblog.blogspot.com/2024/01/test.html',
          title: '테스트 포스트',
          published: '2024-01-01T00:00:00Z',
        }),
      });

      const result = await publishToBlogger(mockParams, mockCredentials);

      expect(result.success).toBe(true);
      expect(result.postId).toBe('post-123');
      expect(result.postUrl).toBe('https://myblog.blogspot.com/2024/01/test.html');
      expect(result.platform).toBe('blogger');
    });

    it('should handle API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Bad request' },
        }),
      });

      const result = await publishToBlogger(mockParams, mockCredentials, { maxRetries: 0, baseDelay: 100, maxDelay: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bad request');
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
            kind: 'blogger#post',
            id: 'post-456',
            url: 'https://myblog.blogspot.com/test',
            published: '2024-01-01T00:00:00Z',
          }),
        });

      const result = await publishToBlogger(mockParams, mockCredentials, { maxRetries: 1, baseDelay: 10, maxDelay: 100 });

      expect(result.success).toBe(true);
      expect(result.postId).toBe('post-456');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should publish as draft when visibility is draft', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          kind: 'blogger#post',
          id: 'post-789',
          url: 'https://myblog.blogspot.com/draft',
        }),
      });

      await publishToBlogger({ ...mockParams, visibility: 'draft' }, mockCredentials);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('isDraft=true'),
        expect.any(Object)
      );
    });

    it('should include labels when tags provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          kind: 'blogger#post',
          id: 'post-1',
          url: 'https://myblog.blogspot.com/test',
        }),
      });

      await publishToBlogger(mockParams, mockCredentials);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"labels":["태그1","태그2"]'),
        })
      );
    });

    it('should convert markdown to HTML', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          kind: 'blogger#post',
          id: 'post-1',
          url: 'https://myblog.blogspot.com/test',
        }),
      });

      await publishToBlogger(
        { ...mockParams, content: '## Heading\n\n**Bold** text' },
        mockCredentials
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('<h2>Heading</h2>'),
        })
      );
    });
  });

  describe('updateBloggerPost', () => {
    it('should update post successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          kind: 'blogger#post',
          id: 'post-123',
          url: 'https://myblog.blogspot.com/updated',
        }),
      });

      const result = await updateBloggerPost('post-123', mockParams, mockCredentials);

      expect(result.success).toBe(true);
      expect(result.postId).toBe('post-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts/post-123'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should return error when credentials missing', async () => {
      const result = await updateBloggerPost('post-123', mockParams, { accessToken: '', blogId: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('인증 정보가 없습니다.');
    });
  });
});
