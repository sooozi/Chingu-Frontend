import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 내가 만든 퀴즈 목록 조회 (GET)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization');
  const API_BASE = process.env.API_BASE_URL;

  if (!API_BASE) {
    return NextResponse.json({ message: 'API 주소 누락' }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_BASE}/api/quizzes/my-quizzes`, {
      method: 'GET',
      headers: {
        Authorization: token ?? '',
      },
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { message: text || '내 퀴즈 조회 실패' },
        { status: res.status }
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json({ message: '응답 파싱 실패' }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json(
      {
        message: '내 퀴즈 조회 중 오류',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
