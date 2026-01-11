import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ keyId: string }>;
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '***';
  return key.substring(0, 8) + '...';
}

function getProviderName(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'claude':
      return 'Claude';
    case 'gemini':
      return 'Gemini';
    case 'grok':
      return 'Grok';
    default:
      return provider;
  }
}

/**
 * GET /api/api-keys/[keyId]
 * API 키 상세 조회
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { keyId } = await params;
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

    const { data: key, error } = await supabase
      .from('api_keys')
      .select('id, provider, encrypted_key, is_valid, last_verified_at, created_at, updated_at')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single();

    if (error?.code === 'PGRST116' || !key) {
      return NextResponse.json(
        { success: false, error: 'API 키를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (error) {
      console.error('Get API key error:', error);
      return NextResponse.json(
        { success: false, error: 'API 키 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    let maskedKey = '***';
    try {
      const decryptedKey = decrypt(key.encrypted_key);
      maskedKey = maskApiKey(decryptedKey);
    } catch {
      // 복호화 실패
    }

    return NextResponse.json({
      success: true,
      apiKey: {
        id: key.id,
        provider: key.provider,
        providerName: getProviderName(key.provider),
        maskedKey,
        isValid: key.is_valid,
        lastVerifiedAt: key.last_verified_at,
        createdAt: key.created_at,
        updatedAt: key.updated_at,
      },
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json(
      { success: false, error: 'API 키 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-keys/[keyId]
 * API 키 삭제
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { keyId } = await params;
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

    // 키 존재 확인
    const { data: existingKey, error: checkError } = await supabase
      .from('api_keys')
      .select('id, provider')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single();

    if (checkError?.code === 'PGRST116' || !existingKey) {
      return NextResponse.json(
        { success: false, error: 'API 키를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete API key error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'API 키 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${getProviderName(existingKey.provider)} API 키가 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { success: false, error: 'API 키 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
