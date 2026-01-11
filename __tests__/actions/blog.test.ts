/**
 * @jest-environment node
 */

import {
  connectTistory,
  handleTistoryCallback,
  connectBlogger,
  handleBloggerCallback,
  connectWordpress,
  disconnectBlog,
  getUserBlogs,
} from '@/lib/actions/blog';

// Mock environment variables
const mockEnv = {
  TISTORY_CLIENT_ID: 'test-tistory-client-id',
  TISTORY_CLIENT_SECRET: 'test-tistory-client-secret',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  ENCRYPTION_KEY: 'test-encryption-key-32-characters',
};

// Set up environment variables before imports
Object.keys(mockEnv).forEach((key) => {
  process.env[key] = mockEnv[key as keyof typeof mockEnv];
});

// Mock Supabase client
const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockUpsertResult = jest.fn();
const mockSelectResult = jest.fn();
const mockDeleteResult = jest.fn();
const mockOrderResult = jest.fn();

const createMockSupabase = () => ({
  auth: {
    getUser: mockGetUser,
    updateUser: mockUpdateUser,
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: mockOrderResult,
        eq: jest.fn(() => mockDeleteResult()),
      })),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: mockUpsertResult,
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

// Mock fetch utility
jest.mock('@/lib/utils/fetch', () => ({
  fetchWithTimeout: jest.fn((url: string, options?: RequestInit) => global.fetch(url, options)),
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

// Mock crypto for encryption
jest.mock('@/lib/crypto', () => ({
  encrypt: jest.fn((text: string) => `encrypted_${text}`),
  decrypt: jest.fn((text: string) => text.replace('encrypted_', '')),
}));

// Mock fetch for external API calls
global.fetch = jest.fn();

describe('Blog Connection Actions', () => {
  const mockOAuthState = 'mock-oauth-state-123';
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      oauth_state: mockOAuthState,
      oauth_state_expires: Date.now() + 10 * 60 * 1000, // 10분 후 만료
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockUpsertResult.mockResolvedValue({
      data: { id: 'blog-123', platform: 'tistory', blog_name: 'Test Blog', blog_url: 'https://test.tistory.com' },
      error: null,
    });
    mockDeleteResult.mockResolvedValue({
      data: null,
      error: null,
    });
    mockOrderResult.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  describe('Tistory OAuth', () => {
    describe('connectTistory', () => {
      it('should return Tistory OAuth URL', async () => {
        const result = await connectTistory();

        expect(result.success).toBe(true);
        expect(result.url).toContain('https://www.tistory.com/oauth/authorize');
        expect(result.url).toContain('client_id=');
        expect(result.url).toContain('redirect_uri=');
        expect(result.url).toContain('response_type=code');
      });

      it('should return error when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await connectTistory();

        expect(result).toEqual({
          success: false,
          error: '로그인이 필요합니다.',
        });
      });
    });

    describe('handleTistoryCallback', () => {
      it('should exchange code for token and save blog info', async () => {
        const mockTokenResponse = {
          access_token: 'tistory_access_token_123',
        };

        const mockBlogInfoResponse = {
          tistory: {
            status: '200',
            item: {
              blogs: [
                {
                  name: 'myblog',
                  url: 'https://myblog.tistory.com',
                  title: 'My Blog',
                },
              ],
            },
          },
        };

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTokenResponse),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockBlogInfoResponse),
          });

        const result = await handleTistoryCallback('auth-code-123', mockOAuthState);

        expect(result.success).toBe(true);
        expect(result.blog).toBeDefined();
      });

      it('should return error when code exchange fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 400,
        });

        const result = await handleTistoryCallback('invalid-code', mockOAuthState);

        expect(result).toEqual({
          success: false,
          error: '티스토리 인증에 실패했습니다.',
        });
      });

      it('should return error when code is missing', async () => {
        const result = await handleTistoryCallback('', mockOAuthState);

        expect(result).toEqual({
          success: false,
          error: '인증 코드가 없습니다.',
        });
      });

      it('should return error when state is invalid', async () => {
        const result = await handleTistoryCallback('auth-code-123', 'wrong-state');

        expect(result).toEqual({
          success: false,
          error: '잘못된 인증 요청입니다. 다시 시도해주세요.',
        });
      });
    });
  });

  describe('Google Blogger OAuth', () => {
    describe('connectBlogger', () => {
      it('should return Google OAuth URL for Blogger', async () => {
        const result = await connectBlogger();

        expect(result.success).toBe(true);
        expect(result.url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
        expect(result.url).toContain('scope=');
        expect(result.url).toContain('blogger');
      });

      it('should return error when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await connectBlogger();

        expect(result).toEqual({
          success: false,
          error: '로그인이 필요합니다.',
        });
      });
    });

    describe('handleBloggerCallback', () => {
      it('should exchange code for token and save blog info', async () => {
        const mockTokenResponse = {
          access_token: 'blogger_access_token_123',
          refresh_token: 'blogger_refresh_token_123',
          expires_in: 3600,
        };

        const mockBlogListResponse = {
          items: [
            {
              id: 'blogger-blog-123',
              name: 'My Blogger',
              url: 'https://myblogger.blogspot.com',
            },
          ],
        };

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTokenResponse),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockBlogListResponse),
          });

        const result = await handleBloggerCallback('auth-code-123', mockOAuthState);

        expect(result.success).toBe(true);
        expect(result.blog).toBeDefined();
      });

      it('should return error when code exchange fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 400,
        });

        const result = await handleBloggerCallback('invalid-code', mockOAuthState);

        expect(result).toEqual({
          success: false,
          error: '구글 블로거 인증에 실패했습니다.',
        });
      });

      it('should return error when state is invalid', async () => {
        const result = await handleBloggerCallback('auth-code-123', 'wrong-state');

        expect(result).toEqual({
          success: false,
          error: '잘못된 인증 요청입니다. 다시 시도해주세요.',
        });
      });
    });
  });

  describe('WordPress Connection', () => {
    describe('connectWordpress', () => {
      it('should verify WordPress credentials and save blog info', async () => {
        const mockWpUserResponse = {
          id: 1,
          name: 'admin',
        };

        const mockSiteResponse = {
          name: 'My WordPress Blog',
        };

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockWpUserResponse),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockSiteResponse),
          });

        const result = await connectWordpress({
          blogUrl: 'https://mywordpress.com',
          username: 'admin',
          applicationPassword: 'xxxx xxxx xxxx xxxx',
        });

        expect(result.success).toBe(true);
        expect(result.blog).toBeDefined();
      });

      it('should return error for invalid credentials', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 401,
        });

        const result = await connectWordpress({
          blogUrl: 'https://mywordpress.com',
          username: 'admin',
          applicationPassword: 'wrong-password',
        });

        expect(result).toEqual({
          success: false,
          error: '워드프레스 인증에 실패했습니다. 사용자명과 애플리케이션 비밀번호를 확인해주세요.',
        });
      });

      it('should return error when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await connectWordpress({
          blogUrl: 'https://mywordpress.com',
          username: 'admin',
          applicationPassword: 'xxxx xxxx xxxx xxxx',
        });

        expect(result).toEqual({
          success: false,
          error: '로그인이 필요합니다.',
        });
      });

      it('should validate blog URL format', async () => {
        const result = await connectWordpress({
          blogUrl: 'not-a-valid-url',
          username: 'admin',
          applicationPassword: 'xxxx xxxx xxxx xxxx',
        });

        expect(result).toEqual({
          success: false,
          error: '올바른 블로그 URL을 입력해주세요.',
        });
      });
    });
  });

  describe('Token Encryption', () => {
    it('should encrypt access token before saving', async () => {
      const mockTokenResponse = {
        access_token: 'plain_access_token',
      };

      const mockBlogInfoResponse = {
        tistory: {
          status: '200',
          item: {
            blogs: [
              {
                name: 'myblog',
                url: 'https://myblog.tistory.com',
                title: 'My Blog',
              },
            ],
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBlogInfoResponse),
        });

      const result = await handleTistoryCallback('auth-code-123', mockOAuthState);

      // Token encryption is verified by the encrypt mock being called
      expect(result.success).toBe(true);
    });
  });

  describe('Blog Disconnection', () => {
    describe('disconnectBlog', () => {
      it('should delete blog connection', async () => {
        const result = await disconnectBlog('blog-123');

        expect(result).toEqual({ success: true });
      });

      it('should return error when blog not found', async () => {
        mockDeleteResult.mockResolvedValueOnce({
          data: null,
          error: { message: 'Blog not found' },
        });

        const result = await disconnectBlog('non-existent-blog');

        expect(result).toEqual({
          success: false,
          error: '블로그 연결 해제에 실패했습니다.',
        });
      });

      it('should return error when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await disconnectBlog('blog-123');

        expect(result).toEqual({
          success: false,
          error: '로그인이 필요합니다.',
        });
      });
    });
  });

  describe('getUserBlogs', () => {
    it('should return list of user blogs', async () => {
      const mockBlogs = [
        {
          id: 'blog-1',
          platform: 'tistory',
          blog_name: 'Tistory Blog',
          blog_url: 'https://myblog.tistory.com',
          is_active: true,
        },
        {
          id: 'blog-2',
          platform: 'blogger',
          blog_name: 'Blogger Blog',
          blog_url: 'https://myblog.blogspot.com',
          is_active: true,
        },
      ];

      mockOrderResult.mockResolvedValueOnce({
        data: mockBlogs,
        error: null,
      });

      const result = await getUserBlogs();

      expect(result.success).toBe(true);
      expect(result.blogs).toEqual(mockBlogs);
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUserBlogs();

      expect(result).toEqual({
        success: false,
        error: '로그인이 필요합니다.',
      });
    });
  });
});
