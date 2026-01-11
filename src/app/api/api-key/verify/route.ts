import { NextRequest, NextResponse } from 'next/server';
import { registerApiKey, verifyApiKey } from '@/lib/actions/apiKey';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, saveKey = true } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'provider와 apiKey가 필요합니다.' },
        { status: 400 }
      );
    }

    // saveKey가 true면 검증 후 저장, false면 검증만
    if (saveKey) {
      const result = await registerApiKey({ provider, apiKey });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, verified: false },
          { status: 400 }
        );
      }

      return NextResponse.json({
        verified: true,
        apiKey: result.apiKey,
      });
    } else {
      const result = await verifyApiKey({ provider, apiKey });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, verified: false },
          { status: 400 }
        );
      }

      return NextResponse.json({
        verified: result.valid,
      });
    }
  } catch (error) {
    console.error('API key verify error:', error);
    return NextResponse.json(
      { error: 'API 키 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
