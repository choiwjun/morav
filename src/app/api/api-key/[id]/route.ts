import { NextRequest, NextResponse } from 'next/server';
import { deleteApiKey, revalidateApiKey } from '@/lib/actions/apiKey';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'API 키 ID가 필요합니다.' }, { status: 400 });
    }

    const result = await deleteApiKey(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'API 키 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!id) {
      return NextResponse.json({ error: 'API 키 ID가 필요합니다.' }, { status: 400 });
    }

    if (action === 'revalidate') {
      const result = await revalidateApiKey(id);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        valid: result.valid,
      });
    }

    return NextResponse.json({ error: '유효하지 않은 action입니다.' }, { status: 400 });
  } catch (error) {
    console.error('API key action error:', error);
    return NextResponse.json(
      { error: 'API 키 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
