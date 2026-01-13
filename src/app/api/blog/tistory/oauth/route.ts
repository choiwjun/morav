import { NextResponse } from 'next/server';
import { connectTistory } from '@/lib/actions/blog';

export async function POST() {
  try {
    const result = await connectTistory();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ authUrl: result.url });
  } catch (error) {
    console.error('Tistory OAuth error:', error);
    return NextResponse.json(
      { error: '티스토리 연결 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
