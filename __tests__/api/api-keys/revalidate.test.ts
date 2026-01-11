/**
 * @jest-environment node
 */

import { POST } from '@/app/api/api-keys/[keyId]/revalidate/route';
import { NextRequest } from 'next/server';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock API key data
const mockApiKey = {
  id: 'key-123',
  provider: 'openai',
  encrypted_key: 'encrypted_sk-12345678abcdefgh',
};

// Mock functions
const mockSingle = jest.fn();
const mockUpdate = jest.fn();

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
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: mockUpdate,
          })),
        })),
      })),
    })
  ),
}));

jest.mock('@/lib/crypto', () => ({
  decrypt: jest.fn((key) => key.replace('encrypted_', '')),
}));

// Mock fetch for API verification
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/utils/fetch', () => ({
  fetchWithTimeout: jest.fn(() => mockFetch()),
}));

const createParams = (keyId: string) => ({
  params: Promise.resolve({ keyId }),
});

describe('API Key Revalidate API - POST /api/api-keys/[keyId]/revalidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should revalidate API key successfully when valid', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockApiKey, error: null });
    mockFetch.mockResolvedValueOnce({ ok: true });
    mockUpdate.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost:3000/api/api-keys/key-123/revalidate', {
      method: 'POST',
    });

    const response = await POST(request, createParams('key-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isValid).toBe(true);
    expect(data.message).toContain('유효합니다');
    expect(data.lastVerifiedAt).toBeDefined();
  });

  it('should mark key as invalid when verification fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockApiKey, error: null });
    mockFetch.mockResolvedValueOnce({ ok: false });
    mockUpdate.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost:3000/api/api-keys/key-123/revalidate', {
      method: 'POST',
    });

    const response = await POST(request, createParams('key-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isValid).toBe(false);
    expect(data.message).toContain('유효하지 않습니다');
  });

  it('should return 404 when key not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const request = new NextRequest('http://localhost:3000/api/api-keys/not-found/revalidate', {
      method: 'POST',
    });

    const response = await POST(request, createParams('not-found'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('찾을 수 없습니다');
  });

  it('should handle update error', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockApiKey, error: null });
    mockFetch.mockResolvedValueOnce({ ok: true });
    mockUpdate.mockResolvedValueOnce({ error: { message: 'Database error' } });

    const request = new NextRequest('http://localhost:3000/api/api-keys/key-123/revalidate', {
      method: 'POST',
    });

    const response = await POST(request, createParams('key-123'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('업데이트에 실패');
  });

  it('should handle different providers', async () => {
    const claudeKey = { ...mockApiKey, provider: 'claude' };
    mockSingle.mockResolvedValueOnce({ data: claudeKey, error: null });
    mockFetch.mockResolvedValueOnce({ ok: true });
    mockUpdate.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost:3000/api/api-keys/key-123/revalidate', {
      method: 'POST',
    });

    const response = await POST(request, createParams('key-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Claude');
  });
});
