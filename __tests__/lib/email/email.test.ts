/**
 * @jest-environment node
 */

import {
  sendPublishSuccessEmail,
  sendPublishFailEmail,
  sendSubscriptionChangeEmail,
  sendUsageLimitEmail,
} from '@/lib/email';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Supabase
const mockSingle = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSingle,
          })),
        })),
      })),
    })
  ),
}));

describe('Email Notification System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.EMAIL_FROM = 'noreply@morav.app';
  });

  describe('sendPublishSuccessEmail', () => {
    it('should send publish success email when notification is enabled', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_publish_success: true },
        error: null,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'email-123' }),
      });

      const result = await sendPublishSuccessEmail(
        'user-123',
        'test@example.com',
        '테스트 포스트',
        'https://example.com/post/123'
      );

      expect(result.sent).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should not send email when notification is disabled', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_publish_success: false },
        error: null,
      });

      const result = await sendPublishSuccessEmail(
        'user-123',
        'test@example.com',
        '테스트 포스트',
        'https://example.com/post/123'
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toContain('비활성화');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_publish_success: true },
        error: null,
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' }),
      });

      const result = await sendPublishSuccessEmail(
        'user-123',
        'test@example.com',
        '테스트 포스트',
        'https://example.com/post/123'
      );

      expect(result.sent).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendPublishFailEmail', () => {
    it('should send publish fail email when notification is enabled', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_publish_fail: true },
        error: null,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'email-123' }),
      });

      const result = await sendPublishFailEmail(
        'user-123',
        'test@example.com',
        '테스트 포스트',
        '발행 중 오류가 발생했습니다.'
      );

      expect(result.sent).toBe(true);
    });

    it('should not send email when notification is disabled', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_publish_fail: false },
        error: null,
      });

      const result = await sendPublishFailEmail(
        'user-123',
        'test@example.com',
        '테스트 포스트',
        '발행 중 오류가 발생했습니다.'
      );

      expect(result.sent).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('sendSubscriptionChangeEmail', () => {
    it('should send subscription change email when notification is enabled', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_subscription_change: true },
        error: null,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'email-123' }),
      });

      const result = await sendSubscriptionChangeEmail(
        'user-123',
        'test@example.com',
        'free',
        'pro'
      );

      expect(result.sent).toBe(true);
    });

    it('should not send email when notification is disabled', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_subscription_change: false },
        error: null,
      });

      const result = await sendSubscriptionChangeEmail(
        'user-123',
        'test@example.com',
        'free',
        'pro'
      );

      expect(result.sent).toBe(false);
    });
  });

  describe('sendUsageLimitEmail', () => {
    it('should send usage limit email when notification is enabled', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_usage_limit: true },
        error: null,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'email-123' }),
      });

      const result = await sendUsageLimitEmail(
        'user-123',
        'test@example.com',
        27,
        30
      );

      expect(result.sent).toBe(true);
    });

    it('should not send email when notification is disabled', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { email_on_usage_limit: false },
        error: null,
      });

      const result = await sendUsageLimitEmail(
        'user-123',
        'test@example.com',
        27,
        30
      );

      expect(result.sent).toBe(false);
    });
  });
});
