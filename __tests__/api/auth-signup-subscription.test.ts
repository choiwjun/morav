/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/signup/route';
import { NextRequest } from 'next/server';

// Mock createFreeTrialSubscription
const mockCreateFreeTrialSubscription = jest.fn();

jest.mock('@/lib/subscription', () => ({
  createFreeTrialSubscription: (userId: string) => mockCreateFreeTrialSubscription(userId),
}));

// Mock Supabase
const mockSignUp = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        signUp: mockSignUp,
      },
    })
  ),
}));

describe('Signup with Subscription Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create free trial subscription on successful signup', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockSignUp.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    mockCreateFreeTrialSubscription.mockResolvedValueOnce({
      success: true,
      subscription: {
        id: 'sub-123',
        userId: 'user-123',
        plan: 'free',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockCreateFreeTrialSubscription).toHaveBeenCalledWith('user-123');
  });

  it('should succeed signup even if subscription creation fails', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockSignUp.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    mockCreateFreeTrialSubscription.mockResolvedValueOnce({
      success: false,
      error: 'Database error',
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should not create subscription on signup failure', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Email already registered' },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'Password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email already registered');
    expect(mockCreateFreeTrialSubscription).not.toHaveBeenCalled();
  });
});
