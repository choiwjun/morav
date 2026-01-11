/**
 * @jest-environment node
 */

import {
  registerApiKey,
  verifyApiKey,
  getUserApiKeys,
  deleteApiKey,
  revalidateApiKey,
} from '@/lib/actions/apiKey';

// Mock Supabase client
const mockGetUser = jest.fn();
const mockUpsertResult = jest.fn();
const mockSelectResult = jest.fn();
const mockUpdateResult = jest.fn();
const mockDeleteResult = jest.fn();

const createMockSupabase = () => ({
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => mockSelectResult()),
        single: mockSelectResult,
        eq: jest.fn(() => ({
          single: mockSelectResult,
        })),
      })),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: mockUpsertResult,
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => mockUpdateResult()),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: mockDeleteResult,
      })),
    })),
  })),
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(createMockSupabase())),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: jest.fn(() => []),
      set: jest.fn(),
      get: jest.fn(),
    })
  ),
}));

// Mock crypto
jest.mock('@/lib/crypto', () => ({
  encrypt: jest.fn((text: string) => `encrypted_${text}`),
  decrypt: jest.fn((text: string) => text.replace('encrypted_', '')),
}));

// Mock fetch for API verification
global.fetch = jest.fn();

describe('API Key Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockUpsertResult.mockResolvedValue({
      data: {
        id: 'key-123',
        provider: 'openai',
        is_valid: true,
      },
      error: null,
    });
    mockSelectResult.mockResolvedValue({
      data: [],
      error: null,
    });
    mockUpdateResult.mockResolvedValue({
      data: null,
      error: null,
    });
    mockDeleteResult.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  describe('OpenAI API Key', () => {
    it('should verify and register valid OpenAI API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'model-1' }] }),
      });

      const result = await registerApiKey({
        provider: 'openai',
        apiKey: 'sk-proj-test-key-12345',
      });

      expect(result.success).toBe(true);
      expect(result.apiKey).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-proj-test-key-12345',
          }),
        })
      );
    });

    it('should reject invalid OpenAI API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await registerApiKey({
        provider: 'openai',
        apiKey: 'invalid-key',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('유효하지 않은');
    });
  });

  describe('Claude API Key', () => {
    it('should verify and register valid Claude API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: 'Hello' }],
          }),
      });

      const result = await registerApiKey({
        provider: 'claude',
        apiKey: 'sk-ant-api03-test-key',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-api03-test-key',
          }),
        })
      );
    });

    it('should reject invalid Claude API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await registerApiKey({
        provider: 'claude',
        apiKey: 'invalid-key',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('유효하지 않은');
    });
  });

  describe('Gemini API Key', () => {
    it('should verify and register valid Gemini API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'Hello' }] } }],
          }),
      });

      const result = await registerApiKey({
        provider: 'gemini',
        apiKey: 'AIzaSyTest-key-12345',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.any(Object)
      );
    });

    it('should reject invalid Gemini API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
      });

      const result = await registerApiKey({
        provider: 'gemini',
        apiKey: 'invalid-key',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('유효하지 않은');
    });
  });

  describe('Grok API Key', () => {
    it('should verify and register valid Grok API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Hello' } }],
          }),
      });

      const result = await registerApiKey({
        provider: 'grok',
        apiKey: 'xai-test-key-12345',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer xai-test-key-12345',
          }),
        })
      );
    });

    it('should reject invalid Grok API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await registerApiKey({
        provider: 'grok',
        apiKey: 'invalid-key',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('유효하지 않은');
    });
  });

  describe('verifyApiKey', () => {
    it('should verify OpenAI API key without saving', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await verifyApiKey({
        provider: 'openai',
        apiKey: 'sk-proj-test-key',
      });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
    });

    it('should return invalid for bad API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await verifyApiKey({
        provider: 'openai',
        apiKey: 'invalid-key',
      });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
    });
  });

  describe('getUserApiKeys', () => {
    it('should return list of user API keys with masked values', async () => {
      mockSelectResult.mockResolvedValueOnce({
        data: [
          {
            id: 'key-1',
            provider: 'openai',
            encrypted_key: 'encrypted_sk-proj-abcd1234',
            is_valid: true,
            created_at: '2024-01-01',
          },
          {
            id: 'key-2',
            provider: 'claude',
            encrypted_key: 'encrypted_sk-ant-api03-xyz',
            is_valid: true,
            created_at: '2024-01-02',
          },
        ],
        error: null,
      });

      const result = await getUserApiKeys();

      expect(result.success).toBe(true);
      expect(result.apiKeys).toHaveLength(2);
      expect(result.apiKeys?.[0].maskedKey).toContain('...');
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUserApiKeys();

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key', async () => {
      const result = await deleteApiKey('key-123');

      expect(result.success).toBe(true);
    });

    it('should return error when key not found', async () => {
      mockDeleteResult.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await deleteApiKey('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('삭제');
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await deleteApiKey('key-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });
  });

  describe('revalidateApiKey', () => {
    it('should revalidate and update API key status', async () => {
      mockSelectResult.mockResolvedValueOnce({
        data: {
          id: 'key-123',
          provider: 'openai',
          encrypted_key: 'encrypted_sk-proj-test',
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await revalidateApiKey('key-123');

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
    });

    it('should mark key as invalid when verification fails', async () => {
      mockSelectResult.mockResolvedValueOnce({
        data: {
          id: 'key-123',
          provider: 'openai',
          encrypted_key: 'encrypted_sk-proj-test',
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await revalidateApiKey('key-123');

      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
    });
  });

  describe('Input validation', () => {
    it('should reject empty API key', async () => {
      const result = await registerApiKey({
        provider: 'openai',
        apiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API 키');
    });

    it('should reject invalid provider', async () => {
      const result = await registerApiKey({
        provider: 'invalid-provider' as any,
        apiKey: 'some-key',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('제공자');
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await registerApiKey({
        provider: 'openai',
        apiKey: 'sk-proj-test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });
  });
});
