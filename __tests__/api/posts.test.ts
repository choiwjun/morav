/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// Mock Supabase - 테스트마다 결과를 다르게 설정하기 위한 전역 변수
const mockUser = { id: 'user-123', email: 'test@example.com' };

// jest.mock 전에 모듈 격리를 위해 별도의 모듈로 분리
const mockQueryResult = {
  current: { data: [] as unknown[], error: null as unknown, count: 0 as number | null },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => {
    // 체인 가능한 쿼리 빌더 mock - 모든 메서드가 항상 체인을 반환하고, range에서만 결과 반환
    const createChain = (): Record<string, jest.Mock> => {
      const chain: Record<string, jest.Mock> = {};
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockReturnValue(chain);
      chain.ilike = jest.fn().mockReturnValue(chain);
      chain.gte = jest.fn().mockReturnValue(chain);
      chain.lte = jest.fn().mockReturnValue(chain);
      chain.select = jest.fn().mockReturnValue(chain);
      chain.single = jest.fn().mockImplementation(() => mockQueryResult.current);
      chain.range = jest.fn().mockImplementation(() => mockQueryResult.current);
      return chain;
    };

    return Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn(() => createChain()),
    });
  }),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: jest.fn(() => []),
      set: jest.fn(),
      get: jest.fn(),
    })
  ),
}));

// GET 함수를 동적으로 import하기 위해 테스트 내에서 import
describe('Posts API', () => {
  let GET: typeof import('@/app/api/posts/route').GET;

  beforeAll(async () => {
    const module = await import('@/app/api/posts/route');
    GET = module.GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryResult.current = { data: [], error: null, count: 0 };
  });

  describe('GET /api/posts', () => {
    it('should return posts list successfully', async () => {
      mockQueryResult.current = {
        data: [
          {
            id: 'post-1',
            title: '테스트 포스트 1',
            content: '본문 1',
            status: 'published',
            published_url: 'https://blog.com/1',
            scheduled_at: null,
            published_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            blogs: { id: 'blog-1', blog_name: '내 블로그', platform: 'tistory' },
            keywords: [{ keyword: '키워드1' }],
          },
          {
            id: 'post-2',
            title: '테스트 포스트 2',
            content: '본문 2',
            status: 'generated',
            published_url: null,
            scheduled_at: '2024-01-02T00:00:00Z',
            published_at: null,
            created_at: '2024-01-02T00:00:00Z',
            blogs: { id: 'blog-1', blog_name: '내 블로그', platform: 'tistory' },
            keywords: [],
          },
        ],
        error: null,
        count: 2,
      };

      const request = new NextRequest('http://localhost:3000/api/posts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.posts).toHaveLength(2);
      expect(data.posts[0].title).toBe('테스트 포스트 1');
      expect(data.posts[0].blog.name).toBe('내 블로그');
      expect(data.posts[0].keyword).toBe('키워드1');
      expect(data.pagination.total).toBe(2);
    });

    it('should return empty list when no posts', async () => {
      mockQueryResult.current = {
        data: [],
        error: null,
        count: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/posts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.posts).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });

    it('should handle pagination parameters', async () => {
      mockQueryResult.current = {
        data: [],
        error: null,
        count: 100,
      };

      const request = new NextRequest('http://localhost:3000/api/posts?page=2&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.totalPages).toBe(10);
    });

    it('should handle database error', async () => {
      mockQueryResult.current = {
        data: null,
        error: { message: 'Database error' },
        count: null,
      };

      const request = new NextRequest('http://localhost:3000/api/posts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return null keyword when no keywords', async () => {
      mockQueryResult.current = {
        data: [
          {
            id: 'post-1',
            title: '키워드 없는 포스트',
            content: '본문',
            status: 'generated',
            published_url: null,
            scheduled_at: null,
            published_at: null,
            created_at: '2024-01-01T00:00:00Z',
            blogs: { id: 'blog-1', blog_name: '내 블로그', platform: 'tistory' },
            keywords: [],
          },
        ],
        error: null,
        count: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/posts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts[0].keyword).toBeNull();
    });

    it('should limit page size to 100', async () => {
      mockQueryResult.current = {
        data: [],
        error: null,
        count: 500,
      };

      const request = new NextRequest('http://localhost:3000/api/posts?limit=200');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(100); // 최대 100으로 제한
    });
  });
});
