'use server';

import { createClient } from '@/lib/supabase/server';

// 유효한 요일 목록
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// 시간 형식 검증 (HH:MM)
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface SaveScheduleParams {
  publishTime: string;
  publishDays: string[];
  timezone?: string;
}

interface ScheduleResult {
  success: boolean;
  schedule?: {
    id: string;
    publish_time: string;
    publish_days: string[];
    timezone: string;
    is_active: boolean;
  } | null;
  error?: string;
}

function isValidTime(time: string): boolean {
  return TIME_REGEX.test(time);
}

function areValidDays(days: string[]): boolean {
  return days.every((day) => VALID_DAYS.includes(day));
}

export async function saveSchedule(params: SaveScheduleParams): Promise<ScheduleResult> {
  const { publishTime, publishDays, timezone = 'Asia/Seoul' } = params;

  // Validate publish days
  if (!publishDays || publishDays.length === 0) {
    return { success: false, error: '최소 1개 이상의 요일을 선택해주세요.' };
  }

  // Validate time format
  if (!isValidTime(publishTime)) {
    return { success: false, error: '유효하지 않은 시간 형식입니다.' };
  }

  // Validate days
  if (!areValidDays(publishDays)) {
    return { success: false, error: '유효하지 않은 요일이 포함되어 있습니다.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // Upsert schedule (create or update)
    const { data: schedule, error: upsertError } = await supabase
      .from('schedules')
      .upsert(
        {
          user_id: user.id,
          publish_time: publishTime,
          publish_days: publishDays,
          timezone,
          is_active: true,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select('id, publish_time, publish_days, timezone, is_active')
      .single();

    if (upsertError || !schedule) {
      console.error('Save schedule error:', upsertError);
      return { success: false, error: '스케줄 저장에 실패했습니다.' };
    }

    return {
      success: true,
      schedule: {
        id: schedule.id,
        publish_time: schedule.publish_time,
        publish_days: schedule.publish_days,
        timezone: schedule.timezone,
        is_active: schedule.is_active,
      },
    };
  } catch (error) {
    console.error('Save schedule error:', error);
    return { success: false, error: '스케줄 저장 중 오류가 발생했습니다.' };
  }
}

export async function getSchedule(): Promise<ScheduleResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: schedule, error: selectError } = await supabase
      .from('schedules')
      .select('id, publish_time, publish_days, timezone, is_active')
      .eq('user_id', user.id)
      .single();

    // If no schedule found, return success with null
    if (selectError?.code === 'PGRST116') {
      return { success: true, schedule: null };
    }

    if (selectError) {
      console.error('Get schedule error:', selectError);
      return { success: false, error: '스케줄 조회에 실패했습니다.' };
    }

    return {
      success: true,
      schedule: schedule
        ? {
            id: schedule.id,
            publish_time: schedule.publish_time,
            publish_days: schedule.publish_days,
            timezone: schedule.timezone,
            is_active: schedule.is_active,
          }
        : null,
    };
  } catch (error) {
    console.error('Get schedule error:', error);
    return { success: false, error: '스케줄 조회 중 오류가 발생했습니다.' };
  }
}
