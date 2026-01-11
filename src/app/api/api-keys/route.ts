import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/crypto';
import { isValidApiKeyLength } from '@/lib/utils/validation';

export const dynamic = 'force-dynamic';

type APIProvider = 'openai' | 'claude' | 'gemini' | 'grok';
const VALID_PROVIDERS: APIProvider[] = ['openai', 'claude', 'gemini', 'grok'];

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
 * GET /api/api-keys
 * 등록된 API 키 목록 조회 (마스킹됨)
 */
export async function GET() {
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

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, provider, encrypted_key, is_valid, last_verified_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get API keys error:', error);
      return NextResponse.json(
        { success: false, error: 'API 키 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    const apiKeys = (keys || []).map((key) => {
      let maskedKey = '***';
      try {
        const decryptedKey = decrypt(key.encrypted_key);
        maskedKey = maskApiKey(decryptedKey);
      } catch {
        // 복호화 실패 시 마스킹된 기본값 사용
      }

      return {
        id: key.id,
        provider: key.provider,
        providerName: getProviderName(key.provider),
        maskedKey,
        isValid: key.is_valid,
        lastVerifiedAt: key.last_verified_at,
        createdAt: key.created_at,
        updatedAt: key.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      apiKeys,
      count: apiKeys.length,
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { success: false, error: 'API 키 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys
 * 새 API 키 등록
 */
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

    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: '제공자와 API 키를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 제공자입니다.' },
        { status: 400 }
      );
    }

    if (!isValidApiKeyLength(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'API 키가 너무 깁니다.' },
        { status: 400 }
      );
    }

    // 암호화
    const encryptedKey = encrypt(apiKey);

    // 저장 (upsert)
    const { data: savedKey, error: upsertError } = await supabase
      .from('api_keys')
      .upsert(
        {
          user_id: user.id,
          provider,
          encrypted_key: encryptedKey,
          is_valid: true,
          last_verified_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert API key error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'API 키 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${getProviderName(provider)} API 키가 등록되었습니다.`,
      apiKey: {
        id: savedKey.id,
        provider: savedKey.provider,
        providerName: getProviderName(savedKey.provider),
        maskedKey: maskApiKey(apiKey),
        isValid: savedKey.is_valid,
      },
    });
  } catch (error) {
    console.error('Register API key error:', error);
    return NextResponse.json(
      { success: false, error: 'API 키 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
