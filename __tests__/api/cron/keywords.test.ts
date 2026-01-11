/**
 * @jest-environment node
 */

import { GET } from '@/app/api/cron/keywords/route';
import { NextRequest } from 'next/server';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase client
const mockKeywordsSelect = jest.fn();
const mockKeywordsInsert = jest.fn();
const mockKeywordsDelete = jest.fn();

const createKeywordsChain = () => {
  const makeAwaitable = (obj: Record<string, unknown>): Record<string, unknown> => {
    obj.select = jest.fn(() => makeAwaitable({ ...obj }));
    obj.eq = jest.fn(() => makeAwaitable({ ...obj }));
    obj.gte = jest.fn(() => makeAwaitable({ ...obj }));
    obj.lt = jest.fn(() => {
      // delete().lt() 체인 처리
      return {
        select: mockKeywordsDelete,
      };
    });
    obj.order = jest.fn(() => makeAwaitable({ ...obj }));
    obj.limit = jest.fn(() => makeAwaitable({ ...obj }));
    obj.insert = mockKeywordsInsert;
    obj.delete = jest.fn(() => makeAwaitable({ ...obj }));

    obj.then = (resolve: (value: unknown) => void) => {
      resolve(mockKeywordsSelect());
    };

    return obj;
  };

  return makeAwaitable({});
};

const createMockSupabase = () => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: jest.fn((table: string) => {
    if (table === 'keywords') {
      return createKeywordsChain();
    }
    return { select: jest.fn(() => ({})) };
  }),
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(createMockSupabase())),
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

describe('Cron Keywords API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CRON_SECRET;

    // Mock fetch to return mock keywords
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    mockKeywordsSelect.mockResolvedValue({ data: [], error: null });
    mockKeywordsInsert.mockResolvedValue({ error: null });
    mockKeywordsDelete.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should collect keywords successfully without CRON_SECRET', async () => {
    const request = new NextRequest('http://localhost:3000/api/cron/keywords');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results).toBeDefined();
    expect(data.results.naver).toBeDefined();
    expect(data.results.google).toBeDefined();
    expect(data.results.cleanup).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it('should require authorization when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const request = new NextRequest('http://localhost:3000/api/cron/keywords');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should allow access with correct Bearer token', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const request = new NextRequest('http://localhost:3000/api/cron/keywords', {
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject incorrect Bearer token', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const request = new NextRequest('http://localhost:3000/api/cron/keywords', {
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return duration in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/cron/keywords');

    const response = await GET(request);
    const data = await response.json();

    expect(data.duration).toBeDefined();
    expect(data.duration).toMatch(/\d+ms/);
  });

  it('should cleanup old keywords', async () => {
    mockKeywordsDelete.mockResolvedValue({
      data: [{ id: 'old-1' }, { id: 'old-2' }],
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/cron/keywords');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.cleanup.success).toBe(true);
    expect(data.results.cleanup.deletedCount).toBe(2);
  });

  it('should handle Naver collection success', async () => {
    // Mock successful Naver API response
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('naver')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            keywordList: [
              { rank: 1, keyword: '테스트 키워드' },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });

    const request = new NextRequest('http://localhost:3000/api/cron/keywords');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle Google collection success', async () => {
    // Mock successful Google RSS response
    const mockRssXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <item>
            <title><![CDATA[인기 검색어]]></title>
          </item>
        </channel>
      </rss>
    `;

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('google')) {
        return Promise.resolve({
          ok: true,
          text: async () => mockRssXml,
        });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });

    const request = new NextRequest('http://localhost:3000/api/cron/keywords');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
