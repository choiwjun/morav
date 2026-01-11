import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// URL 검증 함수
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET() {
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

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch {
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { name, avatar_url } = body;

    const updateData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof name === 'string') {
      updateData.name = name.trim() || null;
    }

    if (typeof avatar_url === 'string') {
      if (avatar_url.trim() === '') {
        updateData.avatar_url = null;
      } else if (!isValidUrl(avatar_url)) {
        return NextResponse.json(
          { error: '유효한 URL 형식이 아닙니다.' },
          { status: 400 }
        );
      } else {
        updateData.avatar_url = avatar_url.trim();
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .select()
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch {
    return NextResponse.json(
      { error: '프로필 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
