'use server';

import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/crypto';
import { fetchWithTimeout } from '@/lib/utils/fetch';
import { isValidApiKeyLength } from '@/lib/utils/validation';

type APIProvider = 'openai' | 'claude' | 'gemini' | 'grok';

interface RegisterApiKeyParams {
  provider: APIProvider;
  apiKey: string;
}

interface ApiKeyResult {
  success: boolean;
  apiKey?: {
    id: string;
    provider: string;
    maskedKey: string;
    is_valid: boolean;
  };
  apiKeys?: Array<{
    id: string;
    provider: string;
    maskedKey: string;
    is_valid: boolean;
    created_at: string;
  }>;
  valid?: boolean;
  error?: string;
}

const VALID_PROVIDERS: APIProvider[] = ['openai', 'claude', 'gemini', 'grok'];
const API_VERIFY_TIMEOUT = 15000; // 15초

// API 키 마스킹 (앞 8자리만 표시)
function maskApiKey(key: string): string {
  if (key.length <= 8) return '***';
  return key.substring(0, 8) + '...';
}

// ==================== API Key Verification ====================

async function verifyOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
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
    // Claude API returns 200 for valid key, even for minimal request
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
        headers: {
          'Content-Type': 'application/json',
        },
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

// ==================== Actions ====================

export async function registerApiKey(params: RegisterApiKeyParams): Promise<ApiKeyResult> {
  const { provider, apiKey } = params;

  // 입력 검증
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, error: 'API 키를 입력해주세요.' };
  }

  if (!isValidApiKeyLength(apiKey)) {
    return { success: false, error: 'API 키가 너무 깁니다.' };
  }

  if (!VALID_PROVIDERS.includes(provider)) {
    return { success: false, error: '유효하지 않은 제공자입니다.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // API 키 검증
    const isValid = await verifyApiKeyByProvider(provider, apiKey);

    if (!isValid) {
      return { success: false, error: `유효하지 않은 ${provider.toUpperCase()} API 키입니다.` };
    }

    // 암호화
    const encryptedKey = encrypt(apiKey);

    // 저장 (upsert - 이미 있으면 업데이트)
    const { data: savedKey, error: insertError } = await supabase
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

    if (insertError) {
      console.error('API key insert error:', insertError);
      return { success: false, error: 'API 키 저장에 실패했습니다.' };
    }

    return {
      success: true,
      apiKey: {
        id: savedKey.id,
        provider: savedKey.provider,
        maskedKey: maskApiKey(apiKey),
        is_valid: savedKey.is_valid,
      },
    };
  } catch (error) {
    console.error('Register API key error:', error);
    return { success: false, error: 'API 키 등록 중 오류가 발생했습니다.' };
  }
}

export async function verifyApiKey(params: RegisterApiKeyParams): Promise<ApiKeyResult> {
  const { provider, apiKey } = params;

  if (!apiKey || apiKey.trim() === '') {
    return { success: false, error: 'API 키를 입력해주세요.' };
  }

  if (!VALID_PROVIDERS.includes(provider)) {
    return { success: false, error: '유효하지 않은 제공자입니다.' };
  }

  try {
    const isValid = await verifyApiKeyByProvider(provider, apiKey);

    return {
      success: true,
      valid: isValid,
    };
  } catch (error) {
    console.error('Verify API key error:', error);
    return { success: false, error: 'API 키 검증 중 오류가 발생했습니다.' };
  }
}

export async function getUserApiKeys(): Promise<ApiKeyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: keys, error: selectError } = await supabase
      .from('api_keys')
      .select('id, provider, encrypted_key, is_valid, created_at, last_verified_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (selectError) {
      console.error('Get API keys error:', selectError);
      return { success: false, error: 'API 키 목록을 가져오는데 실패했습니다.' };
    }

    const apiKeys = (keys || []).map((key) => ({
      id: key.id,
      provider: key.provider,
      maskedKey: maskApiKey(decrypt(key.encrypted_key)),
      is_valid: key.is_valid,
      created_at: key.created_at,
    }));

    return { success: true, apiKeys };
  } catch (error) {
    console.error('Get user API keys error:', error);
    return { success: false, error: 'API 키 목록을 가져오는 중 오류가 발생했습니다.' };
  }
}

export async function deleteApiKey(keyId: string): Promise<ApiKeyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete API key error:', deleteError);
      return { success: false, error: 'API 키 삭제에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete API key error:', error);
    return { success: false, error: 'API 키 삭제 중 오류가 발생했습니다.' };
  }
}

export async function revalidateApiKey(keyId: string): Promise<ApiKeyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 기존 키 조회
    const { data: key, error: selectError } = await supabase
      .from('api_keys')
      .select('id, provider, encrypted_key')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single();

    if (selectError || !key) {
      return { success: false, error: 'API 키를 찾을 수 없습니다.' };
    }

    // 복호화 및 검증
    const decryptedKey = decrypt(key.encrypted_key);
    const isValid = await verifyApiKeyByProvider(key.provider as APIProvider, decryptedKey);

    // 상태 업데이트
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({
        is_valid: isValid,
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update API key error:', updateError);
      return { success: false, error: 'API 키 상태 업데이트에 실패했습니다.' };
    }

    return { success: true, valid: isValid };
  } catch (error) {
    console.error('Revalidate API key error:', error);
    return { success: false, error: 'API 키 재검증 중 오류가 발생했습니다.' };
  }
}
