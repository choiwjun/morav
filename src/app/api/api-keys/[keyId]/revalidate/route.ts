import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { fetchWithTimeout } from '@/lib/utils/fetch';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ keyId: string }>;
}

type APIProvider = 'openai' | 'claude' | 'gemini' | 'grok';
const API_VERIFY_TIMEOUT = 15000;

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

async function verifyOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: API_VERIFY_TIMEOUT,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function verifyClaudeKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
      timeout: API_VERIFY_TIMEOUT,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function verifyGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hi' }] }],
        }),
        timeout: API_VERIFY_TIMEOUT,
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function verifyGrokKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
      }),
      timeout: API_VERIFY_TIMEOUT,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function verifyApiKeyByProvider(provider: APIProvider, apiKey: string): Promise<boolean> {
  switch (provider) {
    case 'openai':
      return verifyOpenAIKey(apiKey);
    case 'claude':
      return verifyClaudeKey(apiKey);
    case 'gemini':
      return verifyGeminiKey(apiKey);
    case 'grok':
      return verifyGrokKey(apiKey);
    default:
      return false;
  }
}

/**
 * POST /api/api-keys/[keyId]/revalidate
 * API 키 재검증
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    // 키 조회
    const { data: key, error: selectError } = await supabase
      .from('api_keys')
      .select('id, provider, encrypted_key')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single();

    if (selectError?.code === 'PGRST116' || !key) {
      return NextResponse.json(
        { success: false, error: 'API 키를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (selectError) {
      console.error('Get API key error:', selectError);
      return NextResponse.json(
        { success: false, error: 'API 키 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 복호화 및 검증
    let isValid = false;
    try {
      const decryptedKey = decrypt(key.encrypted_key);
      isValid = await verifyApiKeyByProvider(key.provider as APIProvider, decryptedKey);
    } catch {
      isValid = false;
    }

    // 상태 업데이트
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({
        is_valid: isValid,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update API key error:', updateError);
      return NextResponse.json(
        { success: false, error: 'API 키 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isValid
        ? `${getProviderName(key.provider)} API 키가 유효합니다.`
        : `${getProviderName(key.provider)} API 키가 유효하지 않습니다.`,
      isValid,
      lastVerifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidate API key error:', error);
    return NextResponse.json(
      { success: false, error: 'API 키 재검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
