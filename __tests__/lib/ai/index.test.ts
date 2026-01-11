/**
 * @jest-environment node
 */

import { generateContent, generateImage, getAvailableProviders, generateAndSaveContent } from '@/lib/ai';
import { ContentGenerationParams } from '@/lib/ai/types';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockApiKeysSelect = jest.fn();
const mockPostsInsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn((table: string) => {
        if (table === 'api_keys') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: mockApiKeysSelect,
                  })),
                  single: mockApiKeysSelect,
                })),
              })),
            })),
          };
        }
        if (table === 'posts') {
          return {
            insert: mockPostsInsert,
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

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: jest.fn(() => []),
      set: jest.fn(),
      get: jest.fn(),
    })
  ),
}));

describe('AI Content Generator Integration', () => {
  const mockParams: ContentGenerationParams = {
    keyword: '테스트 키워드',
    category: 'tech',
    tone: 'professional',
    minLength: 1500,
    language: 'ko',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiKeysSelect.mockResolvedValue({
      data: { encrypted_key: 'test-encrypted-key', is_valid: true },
      error: null,
    });
  });

  describe('generateContent', () => {
    it('should generate content with OpenAI', async () => {
      const mockContent = {
        title: 'OpenAI 생성 제목',
        content: 'H'.repeat(2000),
        summary: '요약',
        tags: ['태그1'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockContent) } }],
        }),
      });

      const result = await generateContent(mockParams, 'openai');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('openai');
      expect(result.data?.title).toBe(mockContent.title);
    });

    it('should generate content with Claude', async () => {
      const mockContent = {
        title: 'Claude 생성 제목',
        content: 'I'.repeat(2000),
        summary: '요약',
        tags: ['태그1'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: JSON.stringify(mockContent) }],
        }),
      });

      const result = await generateContent(mockParams, 'claude');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('claude');
    });

    it('should generate content with Gemini', async () => {
      const mockContent = {
        title: 'Gemini 생성 제목',
        content: 'J'.repeat(2000),
        summary: '요약',
        tags: ['태그1'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockContent) }],
              },
            },
          ],
        }),
      });

      const result = await generateContent(mockParams, 'gemini');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('gemini');
    });

    it('should generate content with Grok', async () => {
      const mockContent = {
        title: 'Grok 생성 제목',
        content: 'K'.repeat(2000),
        summary: '요약',
        tags: ['태그1'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockContent) } }],
        }),
      });

      const result = await generateContent(mockParams, 'grok');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('grok');
    });

    it('should return error when API key not found', async () => {
      mockApiKeysSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await generateContent(mockParams, 'openai');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API 키가 등록되지 않았거나');
    });

    it('should use custom API key if provided', async () => {
      const mockContent = {
        title: '제목',
        content: 'L'.repeat(2000),
        summary: '요약',
        tags: ['태그'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockContent) } }],
        }),
      });

      const result = await generateContent(mockParams, 'openai', {
        apiKey: 'custom-api-key',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer custom-api-key',
          }),
        })
      );
    });
  });

  describe('generateImage', () => {
    it('should generate image with OpenAI', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ url: 'https://example.com/image.png' }],
        }),
      });

      const result = await generateImage({ prompt: 'A test image' }, 'openai');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('openai');
      expect(result.image?.url).toBe('https://example.com/image.png');
    });

    it('should generate image with Gemini', async () => {
      const mockBase64 = 'base64imagedata';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          generated_images: [{ image: { image_bytes: mockBase64 } }],
        }),
      });

      const result = await generateImage({ prompt: 'A test image' }, 'gemini');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('gemini');
    });

    it('should return error for unsupported provider', async () => {
      const result = await generateImage({ prompt: 'test' }, 'claude');

      expect(result.success).toBe(false);
      expect(result.error).toContain('이미지 생성을 지원하지 않습니다');
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of available providers', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() =>
                Promise.resolve({
                  data: [{ provider: 'openai' }, { provider: 'claude' }],
                  error: null,
                })
              ),
            })),
          })),
        })),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValueOnce(mockSupabase);

      const result = await getAvailableProviders();

      expect(result.success).toBe(true);
      expect(result.providers).toContain('openai');
      expect(result.providers).toContain('claude');
    });
  });

  describe('generateAndSaveContent', () => {
    it('should generate and save content', async () => {
      const mockContent = {
        title: '저장할 제목',
        content: 'M'.repeat(2000),
        summary: '요약',
        tags: ['태그'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockContent) } }],
        }),
      });

      mockPostsInsert.mockReturnValueOnce({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'post-123' },
              error: null,
            })
          ),
        })),
      });

      const result = await generateAndSaveContent(
        {
          ...mockParams,
          blogId: 'blog-123',
          keywordId: 'keyword-123',
        },
        'openai'
      );

      expect(result.success).toBe(true);
      expect(result.postId).toBe('post-123');
    });

    it('should return error when content generation fails', async () => {
      mockApiKeysSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await generateAndSaveContent(
        {
          ...mockParams,
          blogId: 'blog-123',
        },
        'openai'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
