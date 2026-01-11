/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/api-keys/route';
import { NextRequest } from 'next/server';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock API keys data
const mockApiKeys = [
  {
    id: 'key-1',
    provider: 'openai',
    encrypted_key: 'encrypted_sk-12345678abcdefgh',
    is_valid: true,
    last_verified_at: '2026-01-10T12:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-10T12:00:00Z',
  },
  {
    id: 'key-2',
    provider: 'claude',
    encrypted_key: 'encrypted_sk-ant-abcd1234',
    is_valid: true,
    last_verified_at: '2026-01-09T12:00:00Z',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-09T12:00:00Z',
  },
];

// Mock functions
const mockSelect = jest.fn();
const mockUpsert = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder,
          }),
        }),
        upsert: mockUpsert.mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      })),
    })
  ),
}));

jest.mock('@/lib/crypto', () => ({
  encrypt: jest.fn((key) => `encrypted_${key}`),
  decrypt: jest.fn((key) => key.replace('encrypted_', '')),
}));

jest.mock('@/lib/utils/validation', () => ({
  isValidApiKeyLength: jest.fn(() => true),
}));

describe('API Keys API - GET /api/api-keys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of API keys with masked values', async () => {
    mockOrder.mockResolvedValueOnce({ data: mockApiKeys, error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.apiKeys).toHaveLength(2);
    expect(data.count).toBe(2);
  });

  it('should mask API keys correctly', async () => {
    mockOrder.mockResolvedValueOnce({ data: [mockApiKeys[0]], error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    const apiKey = data.apiKeys[0];
    expect(apiKey.maskedKey).toContain('...');
    expect(apiKey.maskedKey.length).toBeLessThan(20);
  });

  it('should return provider names', async () => {
    mockOrder.mockResolvedValueOnce({ data: mockApiKeys, error: null });

    const response = await GET();
    const data = await response.json();

    expect(data.apiKeys[0].providerName).toBe('OpenAI');
    expect(data.apiKeys[1].providerName).toBe('Claude');
  });

  it('should return empty list when no keys', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.apiKeys).toHaveLength(0);
    expect(data.count).toBe(0);
  });

  it('should handle database error', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('API 키 목록 조회');
  });
});

describe('API Keys API - POST /api/api-keys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register new API key', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'key-new',
        provider: 'openai',
        is_valid: true,
      },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'openai',
        apiKey: 'sk-12345678abcdefghijklmnop',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('OpenAI');
    expect(data.apiKey.provider).toBe('openai');
    expect(data.apiKey.maskedKey).toContain('...');
  });

  it('should return error for missing fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ provider: 'openai' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('제공자와 API 키');
  });

  it('should return error for invalid provider', async () => {
    const request = new NextRequest('http://localhost:3000/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'invalid_provider',
        apiKey: 'sk-12345678',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('유효하지 않은 제공자');
  });

  it('should handle upsert error', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const request = new NextRequest('http://localhost:3000/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'gemini',
        apiKey: 'AIzaSy12345678',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('저장에 실패');
  });
});
