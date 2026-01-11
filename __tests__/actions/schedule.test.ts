/**
 * @jest-environment node
 */

import { saveSchedule, getSchedule } from '@/lib/actions/schedule';

// Mock Supabase client
const mockGetUser = jest.fn();
const mockSelectResult = jest.fn();
const mockUpsertResult = jest.fn();

const createMockSupabase = () => ({
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: mockSelectResult,
      })),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: mockUpsertResult,
      })),
    })),
  })),
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(createMockSupabase())),
}));

describe('Schedule Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockSchedule = {
    id: 'schedule-123',
    user_id: 'user-123',
    publish_time: '09:00',
    publish_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timezone: 'Asia/Seoul',
    is_active: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('saveSchedule', () => {
    it('should save publish time successfully', async () => {
      const publishTime = '10:00';
      const publishDays = ['Monday', 'Wednesday', 'Friday'];

      mockUpsertResult.mockResolvedValue({
        data: { ...mockSchedule, publish_time: publishTime, publish_days: publishDays },
        error: null,
      });

      const result = await saveSchedule({
        publishTime,
        publishDays,
      });

      expect(result.success).toBe(true);
      expect(result.schedule?.publish_time).toBe(publishTime);
      expect(result.schedule?.publish_days).toEqual(publishDays);
    });

    it('should save publish days successfully', async () => {
      const publishDays = ['Saturday', 'Sunday'];

      mockUpsertResult.mockResolvedValue({
        data: { ...mockSchedule, publish_days: publishDays },
        error: null,
      });

      const result = await saveSchedule({
        publishTime: '09:00',
        publishDays,
      });

      expect(result.success).toBe(true);
      expect(result.schedule?.publish_days).toEqual(publishDays);
    });

    it('should fail if user is not logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await saveSchedule({
        publishTime: '09:00',
        publishDays: ['Monday'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });

    it('should fail if no publish days are provided', async () => {
      const result = await saveSchedule({
        publishTime: '09:00',
        publishDays: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('최소 1개 이상의 요일을 선택해주세요.');
    });

    it('should fail if invalid publish time format is provided', async () => {
      const result = await saveSchedule({
        publishTime: 'invalid-time',
        publishDays: ['Monday'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('유효하지 않은 시간 형식입니다.');
    });

    it('should fail if invalid day is provided', async () => {
      const result = await saveSchedule({
        publishTime: '09:00',
        publishDays: ['Monday', 'InvalidDay'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('유효하지 않은 요일이 포함되어 있습니다.');
    });

    it('should handle database upsert error', async () => {
      mockUpsertResult.mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      });

      const result = await saveSchedule({
        publishTime: '09:00',
        publishDays: ['Monday'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('스케줄 저장에 실패했습니다.');
    });

    it('should accept all valid days of week', async () => {
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      mockUpsertResult.mockResolvedValue({
        data: { ...mockSchedule, publish_days: allDays },
        error: null,
      });

      const result = await saveSchedule({
        publishTime: '09:00',
        publishDays: allDays,
      });

      expect(result.success).toBe(true);
      expect(result.schedule?.publish_days).toEqual(allDays);
    });

    it('should accept valid time formats', async () => {
      const validTimes = ['06:00', '12:00', '18:00', '22:00'];

      for (const time of validTimes) {
        mockUpsertResult.mockResolvedValue({
          data: { ...mockSchedule, publish_time: time },
          error: null,
        });

        const result = await saveSchedule({
          publishTime: time,
          publishDays: ['Monday'],
        });

        expect(result.success).toBe(true);
        expect(result.schedule?.publish_time).toBe(time);
      }
    });
  });

  describe('getSchedule', () => {
    it('should get schedule successfully', async () => {
      mockSelectResult.mockResolvedValue({
        data: mockSchedule,
        error: null,
      });

      const result = await getSchedule();

      expect(result.success).toBe(true);
      expect(result.schedule?.publish_time).toBe('09:00');
      expect(result.schedule?.publish_days).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    });

    it('should fail if user is not logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getSchedule();

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });

    it('should return null schedule if not found', async () => {
      mockSelectResult.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getSchedule();

      expect(result.success).toBe(true);
      expect(result.schedule).toBeNull();
    });
  });
});
