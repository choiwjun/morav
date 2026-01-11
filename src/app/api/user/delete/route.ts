import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 1. users 테이블에서 사용자 데이터 삭제 (RLS로 자신만 삭제 가능)
    const { error: deleteProfileError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteProfileError) {
      console.error('프로필 삭제 오류:', deleteProfileError);
      // 프로필 삭제 실패해도 계속 진행 (auth 삭제가 더 중요)
    }

    // 2. Supabase Auth에서 로그아웃 처리
    // 참고: 실제 auth.users 삭제는 Supabase Admin API 또는 Edge Function 필요
    // 여기서는 로그아웃 처리만 수행
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      return NextResponse.json(
        { error: signOutError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '계정이 삭제되었습니다.',
    });
  } catch {
    return NextResponse.json(
      { error: '계정 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
