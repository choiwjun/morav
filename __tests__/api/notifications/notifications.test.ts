/**
 * @jest-environment node
 */

import { GET, PATCH } from '@/app/api/notifications/route';
import { NextRequest } from 'next/server';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };

// Mock notification settings
const mockSettings = {
  id: 'settings-123',
  user_id: 'user-123',
  email_on_publish_success: true,
  email_on_publish_fail: true,
  email_on_subscription_change: true,
  email_on_usage_limit: true,
  email_marketing: false,
  email_newsletter: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// Mock functions
const mockSingle = jest.fn();
const mockUpsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSingle,
          })),
        })),
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: mockUpsert,
          })),
        })),
      })),
    })
  ),
}));

describe('Notification Settings API - GET /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return notification settings', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockSettings, error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.settings.emailOnPublishSuccess).toBe(true);
    expect(data.settings.emailOnPublishFail).toBe(true);
    expect(data.settings.emailOnSubscriptionChange).toBe(true);
    expect(data.settings.emailOnUsageLimit).toBe(true);
    expect(data.settings.emailMarketing).toBe(false);
    expect(data.settings.emailNewsletter).toBe(false);
  });

  it('should return default settings when not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.settings.emailOnPublishSuccess).toBe(true);
    expect(data.settings.emailMarketing).toBe(false);
  });

  it('should handle database error', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('조회');
  });
});

describe('Notification Settings API - PATCH /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update notification settings', async () => {
    const updatedSettings = { ...mockSettings, email_marketing: true };
    mockUpsert.mockResolvedValueOnce({ data: updatedSettings, error: null });

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        emailOnPublishSuccess: true,
        emailOnPublishFail: true,
        emailMarketing: true,
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('업데이트');
    expect(data.settings.emailMarketing).toBe(true);
  });

  it('should toggle email on publish success', async () => {
    const updatedSettings = { ...mockSettings, email_on_publish_success: false };
    mockUpsert.mockResolvedValueOnce({ data: updatedSettings, error: null });

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        emailOnPublishSuccess: false,
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.settings.emailOnPublishSuccess).toBe(false);
  });

  it('should toggle email on publish fail', async () => {
    const updatedSettings = { ...mockSettings, email_on_publish_fail: false };
    mockUpsert.mockResolvedValueOnce({ data: updatedSettings, error: null });

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        emailOnPublishFail: false,
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings.emailOnPublishFail).toBe(false);
  });

  it('should handle invalid boolean value', async () => {
    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        emailOnPublishSuccess: 'invalid',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('유효하지 않은');
  });

  it('should handle database error on update', async () => {
    mockUpsert.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        emailMarketing: true,
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('업데이트');
  });
});
