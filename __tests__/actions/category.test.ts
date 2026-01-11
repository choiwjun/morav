/**
 * @jest-environment node
 */

import { saveUserCategories, getUserCategories } from '@/lib/actions/category';

// Mock Supabase client
const mockGetUser = jest.fn();
const mockSelectResult = jest.fn();
const mockUpdateResult = jest.fn();

const createMockSupabase = () => ({
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: mockSelectResult,
        order: jest.fn(() => mockSelectResult()),
        eq: jest.fn(() => ({
          single: mockSelectResult,
        })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: mockUpdateResult,
          })),
        })),
      })),
    })),
  })),
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(createMockSupabase())),
}));

describe('Category Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockBlog = {
    id: 'blog-123',
    user_id: 'user-123',
    platform: 'tistory',
    blog_name: 'Test Blog',
    blog_url: 'https://test.tistory.com',
    categories: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('saveUserCategories', () => {
    it('should save categories to blog record successfully', async () => {
      const categories = ['tech', 'business', 'lifestyle'];

      mockSelectResult.mockResolvedValue({
        data: mockBlog,
        error: null,
      });

      mockUpdateResult.mockResolvedValue({
        data: { ...mockBlog, categories },
        error: null,
      });

      const result = await saveUserCategories({
        blogId: 'blog-123',
        categories,
      });

      expect(result.success).toBe(true);
      expect(result.categories).toEqual(categories);
    });

    it('should fail if user is not logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await saveUserCategories({
        blogId: 'blog-123',
        categories: ['tech'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });

    it('should fail if no categories are provided', async () => {
      const result = await saveUserCategories({
        blogId: 'blog-123',
        categories: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('최소 1개 이상의 카테고리를 선택해주세요.');
    });

    it('should fail if more than 5 categories are provided', async () => {
      const result = await saveUserCategories({
        blogId: 'blog-123',
        categories: ['tech', 'business', 'lifestyle', 'health', 'travel', 'food'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('최대 5개까지 카테고리를 선택할 수 있습니다.');
    });

    it('should fail if invalid category is provided', async () => {
      const result = await saveUserCategories({
        blogId: 'blog-123',
        categories: ['tech', 'invalid_category'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('유효하지 않은 카테고리가 포함되어 있습니다.');
    });

    it('should fail if blog is not found', async () => {
      mockSelectResult.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await saveUserCategories({
        blogId: 'non-existent-blog',
        categories: ['tech'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('블로그를 찾을 수 없습니다.');
    });

    it('should fail if blog does not belong to user', async () => {
      mockSelectResult.mockResolvedValue({
        data: { ...mockBlog, user_id: 'different-user' },
        error: null,
      });

      const result = await saveUserCategories({
        blogId: 'blog-123',
        categories: ['tech'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('블로그를 찾을 수 없습니다.');
    });

    it('should handle database update error', async () => {
      mockSelectResult.mockResolvedValue({
        data: mockBlog,
        error: null,
      });

      mockUpdateResult.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await saveUserCategories({
        blogId: 'blog-123',
        categories: ['tech'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('카테고리 저장에 실패했습니다.');
    });
  });

  describe('getUserCategories', () => {
    it('should get categories from blog record successfully', async () => {
      const categories = ['tech', 'business'];

      mockSelectResult.mockResolvedValue({
        data: { ...mockBlog, categories },
        error: null,
      });

      const result = await getUserCategories('blog-123');

      expect(result.success).toBe(true);
      expect(result.categories).toEqual(categories);
    });

    it('should fail if user is not logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUserCategories('blog-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });

    it('should fail if blog is not found', async () => {
      mockSelectResult.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await getUserCategories('non-existent-blog');

      expect(result.success).toBe(false);
      expect(result.error).toBe('블로그를 찾을 수 없습니다.');
    });

    it('should return empty array if no categories are set', async () => {
      mockSelectResult.mockResolvedValue({
        data: { ...mockBlog, categories: null },
        error: null,
      });

      const result = await getUserCategories('blog-123');

      expect(result.success).toBe(true);
      expect(result.categories).toEqual([]);
    });
  });
});
