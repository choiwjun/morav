import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 모든 키워드 삭제 (관리자용)
export async function DELETE(request: NextRequest) {
  try {
    // Cron secret 검증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // 모든 키워드 삭제
    const { data: deleted, error: deleteError } = await supabase
      .from('keywords')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 레코드 삭제 트릭
      .select('id');

    if (deleteError) {
      console.error('Delete keywords error:', deleteError);
      return NextResponse.json(
        { error: '키워드 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: deleted?.length || 0,
      message: '모든 키워드가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: '키워드 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
