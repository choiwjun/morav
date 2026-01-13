import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// MIME 타입에 따른 안전한 확장자 매핑
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 2MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일 형식 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'JPG, PNG, WebP 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 기존 아바타 삭제 (있으면)
    const { data: existingUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (existingUser?.avatar_url) {
      // 기존 파일 경로 추출 및 삭제
      const oldPath = existingUser.avatar_url.split('/avatars/').pop();
      if (oldPath) {
        const { error: deleteError } = await supabase.storage.from('avatars').remove([oldPath]);
        if (deleteError) {
          console.warn('Failed to delete old avatar:', deleteError);
          // 삭제 실패해도 계속 진행 (고아 파일이 될 수 있지만 업로드는 허용)
        }
      }
    }

    // MIME 타입 기반으로 안전한 확장자 결정 (클라이언트 파일명 사용 안 함)
    const fileExtension = MIME_TO_EXTENSION[file.type] || 'jpg';
    // 파일명에 UUID와 타임스탬프 사용으로 예측 불가능하게
    const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: '파일 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path);

    const avatarUrl = publicUrlData.publicUrl;

    // users 테이블에 avatar_url 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('User update error:', updateError);
      return NextResponse.json(
        { success: false, error: '프로필 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl,
    });
  } catch (error) {
    console.error('Avatar upload API error:', error);
    return NextResponse.json(
      { success: false, error: '아바타 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 기존 아바타 경로 가져오기
    const { data: existingUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (existingUser?.avatar_url) {
      // Storage에서 파일 삭제
      const oldPath = existingUser.avatar_url.split('/avatars/').pop();
      if (oldPath) {
        const { error: deleteError } = await supabase.storage.from('avatars').remove([oldPath]);
        if (deleteError) {
          console.warn('Failed to delete avatar from storage:', deleteError);
          // Storage 삭제 실패해도 DB 업데이트는 진행
        }
      }
    }

    // users 테이블에서 avatar_url 제거
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: '프로필 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Avatar delete API error:', error);
    return NextResponse.json(
      { success: false, error: '아바타 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
