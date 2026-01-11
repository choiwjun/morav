/**
 * @jest-environment node
 */

import { generateContentWithOpenAI, generateImageWithOpenAI } from '@/lib/ai/openai';
import { ContentGenerationParams, AIGeneratorConfig } from '@/lib/ai/types';

// Mock fetch
global.fetch = jest.fn();

describe('OpenAI Content Generator', () => {
  const mockConfig: AIGeneratorConfig = {
    apiKey: 'test-api-key',
  };

  const mockParams: ContentGenerationParams = {
    keyword: '인공지능 트렌드',
    category: 'tech',
    tone: 'professional',
    minLength: 1500,
    language: 'ko',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when API key is missing', async () => {
    const result = await generateContentWithOpenAI(mockParams, { apiKey: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('OpenAI API 키가 필요합니다.');
    expect(result.provider).toBe('openai');
  });

  it('should generate content successfully', async () => {
    const mockContent = {
      title: '2024년 인공지능 트렌드 분석',
      content: 'A'.repeat(2000), // 2000자 이상
      summary: 'AI 트렌드에 대한 요약입니다.',
      tags: ['AI', '트렌드', '기술'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(mockContent),
            },
          },
        ],
      }),
    });

    const result = await generateContentWithOpenAI(mockParams, mockConfig);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBe(mockContent.title);
    expect(result.data?.wordCount).toBeGreaterThanOrEqual(1500);
    expect(result.provider).toBe('openai');
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

    const result = await generateContentWithOpenAI(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('should handle empty response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [],
      }),
    });

    const result = await generateContentWithOpenAI(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('콘텐츠 생성 결과가 없습니다.');
  });

  it('should handle invalid JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      }),
    });

    const result = await generateContentWithOpenAI(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('콘텐츠 파싱에 실패했습니다.');
  });

  it('should reject content below minimum length', async () => {
    const shortContent = {
      title: '짧은 제목',
      content: '짧은 본문', // 1500자 미만
      summary: '요약',
      tags: ['태그'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(shortContent),
            },
          },
        ],
      }),
    });

    const result = await generateContentWithOpenAI(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('최소 길이');
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await generateContentWithOpenAI(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should use custom model and temperature', async () => {
    const mockContent = {
      title: '제목',
      content: 'B'.repeat(2000),
      summary: '요약',
      tags: ['태그'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockContent) } }],
      }),
    });

    await generateContentWithOpenAI(mockParams, {
      ...mockConfig,
      model: 'gpt-4o',
      temperature: 0.5,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"model":"gpt-4o"'),
      })
    );
  });
});

describe('OpenAI Image Generator', () => {
  const mockConfig: AIGeneratorConfig = {
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when API key is missing', async () => {
    const result = await generateImageWithOpenAI(
      { prompt: 'A beautiful sunset' },
      { apiKey: '' }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('OpenAI API 키가 필요합니다.');
  });

  it('should generate image successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            url: 'https://example.com/image.png',
            revised_prompt: 'A beautiful sunset over the ocean',
          },
        ],
      }),
    });

    const result = await generateImageWithOpenAI(
      { prompt: 'A beautiful sunset', style: 'realistic' },
      mockConfig
    );

    expect(result.success).toBe(true);
    expect(result.image).toBeDefined();
    expect(result.image?.url).toBe('https://example.com/image.png');
    expect(result.image?.revisedPrompt).toBe('A beautiful sunset over the ocean');
  });

  it('should handle API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: 'Invalid prompt' },
      }),
    });

    const result = await generateImageWithOpenAI(
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
        data: [],
      }),
    });

    const result = await generateImageWithOpenAI(
      { prompt: 'test' },
      mockConfig
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('이미지 생성 결과가 없습니다.');
  });
});
