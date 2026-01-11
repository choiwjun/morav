/**
 * @jest-environment node
 */

import { GET } from '@/app/api/cron/publish/route';
import { NextRequest } from 'next/server';

// Mock fetch
global.fetch = jest.fn();

// Mock publishScheduledPosts
jest.mock('@/lib/blog', () => ({
  publishScheduledPosts: jest.fn(),
}));

import { publishScheduledPosts } from '@/lib/blog';

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: jest.fn(() => []),
      set: jest.fn(),
      get: jest.fn(),
    })
  ),
}));

describe('Publish Cron API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CRON_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should publish posts successfully without CRON_SECRET', async () => {
    (publishScheduledPosts as jest.Mock).mockResolvedValueOnce({
      success: true,
      published: 2,
      failed: 0,
      errors: [],
    });

    const request = new NextRequest('http://localhost:3000/api/cron/publish');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.published).toBe(2);
    expect(data.failed).toBe(0);
    expect(data.timestamp).toBeDefined();
  });

  it('should require authorization when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const request = new NextRequest('http://localhost:3000/api/cron/publish');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should allow access with correct Bearer token', async () => {
    process.env.CRON_SECRET = 'test-secret';

    (publishScheduledPosts as jest.Mock).mockResolvedValueOnce({
      success: true,
      published: 1,
      failed: 0,
      errors: [],
    });

    const request = new NextRequest('http://localhost:3000/api/cron/publish', {
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return duration in response', async () => {
    (publishScheduledPosts as jest.Mock).mockResolvedValueOnce({
      success: true,
      published: 0,
      failed: 0,
      errors: [],
    });

    const request = new NextRequest('http://localhost:3000/api/cron/publish');

    const response = await GET(request);
    const data = await response.json();

    expect(data.duration).toBeDefined();
    expect(data.duration).toMatch(/\d+ms/);
  });

  it('should report errors when publishing fails', async () => {
    (publishScheduledPosts as jest.Mock).mockResolvedValueOnce({
      success: true,
      published: 1,
      failed: 2,
      errors: ['Post 1: API error', 'Post 2: Timeout'],
    });

    const request = new NextRequest('http://localhost:3000/api/cron/publish');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.published).toBe(1);
    expect(data.failed).toBe(2);
    expect(data.errors).toHaveLength(2);
  });

  it('should handle function error', async () => {
    (publishScheduledPosts as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/cron/publish');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});
