import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createFreeTrialSubscription } from '@/lib/subscription';

// RFC 5322 기반 이메일 검증 정규식
function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// 비밀번호 복잡성 검증
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: '비밀번호에 대문자를 포함해주세요.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: '비밀번호에 소문자를 포함해주세요.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '비밀번호에 숫자를 포함해주세요.' };
  }
  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || null,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // 회원가입 성공 시 무료 체험 구독 생성
    if (data.user) {
      const subscriptionResult = await createFreeTrialSubscription(data.user.id);
      if (!subscriptionResult.success) {
        console.error('Failed to create free trial subscription:', subscriptionResult.error);
        // 구독 생성 실패해도 회원가입은 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch {
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
