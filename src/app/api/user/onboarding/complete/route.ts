import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // Update user metadata to mark onboarding as complete
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      console.error('Update user metadata error:', updateError);
      return NextResponse.json(
        { error: '온보딩 완료 처리에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '온보딩이 완료되었습니다.',
    });
  } catch (error) {
    console.error('Onboarding complete API error:', error);
    return NextResponse.json(
      { error: '온보딩 완료 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
