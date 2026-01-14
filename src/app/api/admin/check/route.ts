import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false, reason: 'not_authenticated' }, { status: 401 });
    }

    const adminEmails = process.env.ADMIN_EMAILS || '';
    const isAdminUser = isAdmin(user.email);

    // 디버깅용 로그 (프로덕션에서 확인 후 제거 가능)
    console.log('[Admin Check]', {
      userEmail: user.email,
      adminEmails: adminEmails,
      isAdmin: isAdminUser,
    });

    return NextResponse.json({
      isAdmin: isAdminUser,
      // 디버깅용 - 프로덕션에서 제거 가능
      debug: {
        userEmail: user.email,
        configuredAdmins: adminEmails ? adminEmails.split(',').map(e => e.trim()) : [],
      }
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false, reason: 'error' }, { status: 500 });
  }
}
