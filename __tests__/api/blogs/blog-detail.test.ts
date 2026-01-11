/**
 * @jest-environment node
 */

import { GET, PATCH, DELETE } from '@/app/api/blogs/[blogId]/route';
import { NextRequest } from 'next/server';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock blog data
const mockBlog = {
  id: 'blog-123',
  platform: 'tistory',
  blog_name: '내 블로그',
  blog_url: 'https://myblog.tistory.com',
  categories: ['tech', 'lifestyle'],
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
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
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: mockSingle,
              })),
            })),
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

const createParams = (blogId: string) => ({
  params: Promise.resolve({ blogId }),
});

describe('Blog Detail API - GET /api/blogs/[blogId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return blog details', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockBlog, error: null });

    const request = new NextRequest('http://localhost:3000/api/blogs/blog-123');
    const response = await GET(request, createParams('blog-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.blog.id).toBe('blog-123');
    expect(data.blog.platform).toBe('tistory');
    expect(data.blog.platformName).toBe('티스토리');
    expect(data.blog.name).toBe('내 블로그');
  });

  it('should return 404 when blog not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const request = new NextRequest('http://localhost:3000/api/blogs/not-found');
    const response = await GET(request, createParams('not-found'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('찾을 수 없습니다');
  });
});

describe('Blog Detail API - PATCH /api/blogs/[blogId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update blog categories', async () => {
    // First call: check existing blog
    mockSingle.mockResolvedValueOnce({ data: { id: 'blog-123' }, error: null });
    // Second call: update and return
    mockSingle.mockResolvedValueOnce({
      data: { ...mockBlog, categories: ['travel', 'food'] },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/blogs/blog-123', {
      method: 'PATCH',
      body: JSON.stringify({ categories: ['travel', 'food'] }),
    });

    const response = await PATCH(request, createParams('blog-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('업데이트');
  });

  it('should update blog active status', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'blog-123' }, error: null });
    mockSingle.mockResolvedValueOnce({
      data: { ...mockBlog, is_active: false },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/blogs/blog-123', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });

    const response = await PATCH(request, createParams('blog-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return error for invalid categories type', async () => {
    const request = new NextRequest('http://localhost:3000/api/blogs/blog-123', {
      method: 'PATCH',
      body: JSON.stringify({ categories: 'not-an-array' }),
    });

    const response = await PATCH(request, createParams('blog-123'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('배열');
  });

  it('should return error for invalid isActive type', async () => {
    const request = new NextRequest('http://localhost:3000/api/blogs/blog-123', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: 'not-boolean' }),
    });

    const response = await PATCH(request, createParams('blog-123'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('불리언');
  });

  it('should return 404 when blog not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const request = new NextRequest('http://localhost:3000/api/blogs/not-found', {
      method: 'PATCH',
      body: JSON.stringify({ categories: ['tech'] }),
    });

    const response = await PATCH(request, createParams('not-found'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});

describe('Blog Detail API - DELETE /api/blogs/[blogId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete blog successfully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'blog-123', blog_name: '내 블로그' },
      error: null,
    });
    mockDeleteResult.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost:3000/api/blogs/blog-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, createParams('blog-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('삭제');
    expect(data.message).toContain('내 블로그');
  });

  it('should return 404 when blog not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const request = new NextRequest('http://localhost:3000/api/blogs/not-found', {
      method: 'DELETE',
    });

    const response = await DELETE(request, createParams('not-found'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('찾을 수 없습니다');
  });
});
