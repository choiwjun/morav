/**
 * @jest-environment node
 */

import { generateContentWithClaude } from '@/lib/ai/claude';
import { ContentGenerationParams, AIGeneratorConfig } from '@/lib/ai/types';

// Mock fetch
global.fetch = jest.fn();

describe('Claude Content Generator', () => {
  const mockConfig: AIGeneratorConfig = {
    apiKey: 'test-api-key',
  };

  const mockParams: ContentGenerationParams = {
    keyword: '건강한 식단',
    category: 'health',
    tone: 'friendly',
    minLength: 1500,
    language: 'ko',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when API key is missing', async () => {
    const result = await generateContentWithClaude(mockParams, { apiKey: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Claude API 키가 필요합니다.');
    expect(result.provider).toBe('claude');
  });

  it('should generate content successfully', async () => {
    const mockContent = {
      title: '건강한 식단 가이드',
      content: 'C'.repeat(2000),
      summary: '건강한 식단에 대한 요약입니다.',
      tags: ['건강', '식단', '영양'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockContent),
          },
        ],
      }),
    });

    const result = await generateContentWithClaude(mockParams, mockConfig);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBe(mockContent.title);
    expect(result.data?.wordCount).toBeGreaterThanOrEqual(1500);
    expect(result.provider).toBe('claude');
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

    const result = await generateContentWithClaude(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('should handle empty response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [],
      }),
    });

    const result = await generateContentWithClaude(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('콘텐츠 생성 결과가 없습니다.');
  });

  it('should handle invalid JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: 'Not valid JSON content',
          },
        ],
      }),
    });

    const result = await generateContentWithClaude(mockParams, mockConfig);

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
        content: [
          {
            type: 'text',
            text: JSON.stringify(shortContent),
          },
        ],
      }),
    });

    const result = await generateContentWithClaude(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('최소 길이');
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await generateContentWithClaude(mockParams, mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should send correct headers', async () => {
    const mockContent = {
      title: '제목',
      content: 'D'.repeat(2000),
      summary: '요약',
      tags: ['태그'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockContent) }],
      }),
    });

    await generateContentWithClaude(mockParams, mockConfig);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
          'anthropic-version': '2023-06-01',
        }),
      })
    );
  });

  it('should use different tones correctly', async () => {
    const mockContent = {
      title: '제목',
      content: 'E'.repeat(2000),
      summary: '요약',
      tags: ['태그'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockContent) }],
      }),
    });

    await generateContentWithClaude(
      { ...mockParams, tone: 'casual' },
      mockConfig
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('편안하고 친근한'),
      })
    );
  });
});
