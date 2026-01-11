/**
 * @jest-environment node
 */

import { GET } from '@/app/api/blogs/route';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock blogs data
const mockBlogs = [
  {
    id: 'blog-1',
    platform: 'tistory',
    blog_name: '내 티스토리 블로그',
    blog_url: 'https://myblog.tistory.com',
    categories: ['tech', 'lifestyle'],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'blog-2',
    platform: 'blogger',
    blog_name: '구글 블로거',
    blog_url: 'https://myblog.blogspot.com',
    categories: ['travel'],
    is_active: true,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
];

// Mock functions
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

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
      })),
    })
  ),
}));

describe('Blogs API - GET /api/blogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of connected blogs', async () => {
    mockOrder.mockResolvedValueOnce({ data: mockBlogs, error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.blogs).toHaveLength(2);
    expect(data.count).toBe(2);
  });

  it('should format blog data correctly', async () => {
    mockOrder.mockResolvedValueOnce({ data: [mockBlogs[0]], error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    const blog = data.blogs[0];
    expect(blog.id).toBe('blog-1');
    expect(blog.platform).toBe('tistory');
    expect(blog.platformName).toBe('티스토리');
    expect(blog.name).toBe('내 티스토리 블로그');
    expect(blog.url).toBe('https://myblog.tistory.com');
    expect(blog.categories).toEqual(['tech', 'lifestyle']);
    expect(blog.isActive).toBe(true);
  });

  it('should return empty list when no blogs', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.blogs).toHaveLength(0);
    expect(data.count).toBe(0);
  });

  it('should handle database error', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('블로그 목록 조회');
  });

  it('should return correct platform names', async () => {
    const allPlatformBlogs = [
      { ...mockBlogs[0], platform: 'tistory' },
      { ...mockBlogs[1], platform: 'blogger', id: 'blog-2' },
      { ...mockBlogs[0], platform: 'wordpress', id: 'blog-3' },
    ];
    mockOrder.mockResolvedValueOnce({ data: allPlatformBlogs, error: null });

    const response = await GET();
    const data = await response.json();

    expect(data.blogs[0].platformName).toBe('티스토리');
    expect(data.blogs[1].platformName).toBe('구글 블로거');
    expect(data.blogs[2].platformName).toBe('워드프레스');
  });
});
