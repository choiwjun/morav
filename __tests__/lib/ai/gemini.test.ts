/**
 * @jest-environment node
 */

import { generateContentWithGemini, generateImageWithGemini } from '@/lib/ai/gemini';
import { ContentGenerationParams, AIGeneratorConfig } from '@/lib/ai/types';

// Mock fetch
global.fetch = jest.fn();

describe('Gemini Content Generator', () => {
  const mockConfig: AIGeneratorConfig = {
    apiKey: 'test-api-key',
  };

  const mockParams: ContentGenerationParams = {
    keyword: '여행 팁',
    category: 'travel',
    tone: 'casual',
    minLength: 1500,
    language: 'ko',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when API key is missing', async () => {
    const result = await generateContentWithGemini(mockParams, { apiKey: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Gemini API 키가 필요합니다.');
    expect(result.provider).toBe('gemini');
  });

  it('should generate content successfully', async () => {
    const mockContent = {
      title: '여행 팁 완벽 가이드',
      content: 'F'.repeat(2000),
      summary: '여행에 대한 유용한 팁입니다.',
      tags: ['여행', '팁', '가이드'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify(mockContent),
                },
              ],
            },
          },
        ],
      }),
    });

    const result = await generateContentWithGemini(mockParams, mockConfig);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBe(mockContent.title);
    expect(result.data?.wordCount).toBeGreaterThanOrEqual(1500);
    expect(result.provider).toBe('gemini');
    expect(result.processingTime).toBeDefined();
  });

  it('should handle API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: 'Invalid API key' },
      }),
    });

    const result = await generateContentWithGemini(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('should handle empty response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [],
      }),
    });

    const result = await generateContentWithGemini(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('콘텐츠 생성 결과가 없습니다.');
  });

  it('should handle invalid JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Invalid JSON',
                },
              ],
            },
          },
        ],
      }),
    });

    const result = await generateContentWithGemini(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('콘텐츠 파싱에 실패했습니다.');
  });

  it('should reject content below minimum length', async () => {
    const shortContent = {
      title: '짧은 제목',
      content: '짧은 본문',
      summary: '요약',
      tags: ['태그'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(shortContent) }],
            },
          },
        ],
      }),
    });

    const result = await generateContentWithGemini(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('최소 길이');
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await generateContentWithGemini(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should include API key in URL', async () => {
    const mockContent = {
      title: '제목',
      content: 'G'.repeat(2000),
      summary: '요약',
      tags: ['태그'],
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

    await generateContentWithGemini(mockParams, mockConfig);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('key=test-api-key'),
      expect.any(Object)
    );
  });
});

describe('Gemini Image Generator', () => {
  const mockConfig: AIGeneratorConfig = {
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when API key is missing', async () => {
    const result = await generateImageWithGemini(
      { prompt: 'A beautiful landscape' },
      { apiKey: '' }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Gemini API 키가 필요합니다.');
  });

  it('should generate image successfully', async () => {
    const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_images: [
          {
            image: {
              image_bytes: mockBase64,
            },
          },
        ],
      }),
    });

    const result = await generateImageWithGemini(
      { prompt: 'A beautiful landscape', style: 'artistic' },
      mockConfig
    );

    expect(result.success).toBe(true);
    expect(result.image).toBeDefined();
    expect(result.image?.url).toContain('data:image/png;base64,');
  });

  it('should handle API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: 'Invalid prompt' },
      }),
    });

    const result = await generateImageWithGemini(
      { prompt: 'test' },
      mockConfig
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid prompt');
  });

  it('should handle empty response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_images: [],
      }),
    });

    const result = await generateImageWithGemini(
      { prompt: 'test' },
      mockConfig
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('이미지 생성 결과가 없습니다.');
  });

  it('should handle missing image data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_images: [
          {
            image: {},
          },
        ],
      }),
    });

    const result = await generateImageWithGemini(
      { prompt: 'test' },
      mockConfig
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('이미지 데이터가 없습니다.');
  });
});
