import { NextRequest, NextResponse } from 'next/server';
import { saveSchedule, getSchedule } from '@/lib/actions/schedule';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publishTime, publishDays, timezone } = body;

    const result = await saveSchedule({
      publishTime,
      publishDays,
      timezone,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      schedule: result.schedule,
    });
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: '스케줄 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await getSchedule();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      schedule: result.schedule,
    });
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: '스케줄 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
