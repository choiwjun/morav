/**
 * @jest-environment node
 */

import { GET, DELETE } from '@/app/api/api-keys/[keyId]/route';
import { NextRequest } from 'next/server';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock API key data
const mockApiKey = {
  id: 'key-123',
  provider: 'openai',
  encrypted_key: 'encrypted_sk-12345678abcdefgh',
  is_valid: true,
  last_verified_at: '2026-01-10T12:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-10T12:00:00Z',
};

// Mock functions
const mockSingle = jest.fn();
const mockDeleteResult = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: mockSingle,
            })),
            single: mockSingle,
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: mockDeleteResult,
          })),
        })),
      })),
    })
  ),
}));

jest.mock('@/lib/crypto', () => ({
  decrypt: jest.fn((key) => key.replace('encrypted_', '')),
}));

const createParams = (keyId: string) => ({
  params: Promise.resolve({ keyId }),
});

describe('API Key Detail API - GET /api/api-keys/[keyId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return API key details with masked value', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockApiKey, error: null });

    const request = new NextRequest('http://localhost:3000/api/api-keys/key-123');
    const response = await GET(request, createParams('key-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.apiKey.id).toBe('key-123');
    expect(data.apiKey.provider).toBe('openai');
    expect(data.apiKey.providerName).toBe('OpenAI');
    expect(data.apiKey.maskedKey).toContain('...');
    expect(data.apiKey.isValid).toBe(true);
  });

  it('should return 404 when key not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const request = new NextRequest('http://localhost:3000/api/api-keys/not-found');
    const response = await GET(request, createParams('not-found'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('찾을 수 없습니다');
  });
});

describe('API Key Detail API - DELETE /api/api-keys/[keyId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete API key successfully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'key-123', provider: 'openai' },
      error: null,
    });
    mockDeleteResult.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost:3000/api/api-keys/key-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, createParams('key-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('삭제');
    expect(data.message).toContain('OpenAI');
  });

  it('should return 404 when key not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const request = new NextRequest('http://localhost:3000/api/api-keys/not-found', {
      method: 'DELETE',
    });

    const response = await DELETE(request, createParams('not-found'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('찾을 수 없습니다');
  });
});
