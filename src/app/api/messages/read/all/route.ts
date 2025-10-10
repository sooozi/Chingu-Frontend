import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 받은 쪽지 전체 조회 (GET)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization');
  const API_BASE = process.env.API_BASE_URL;

  if (!API_BASE) {
    return NextResponse.json({ message: 'API 주소 누락' }, { status: 500 });
  }

  try {
    console.log('[받은 쪽지 전체 조회 프록시] 요청 데이터:', {
      token: token ? `${token.substring(0, 20)}...` : 'null',
      API_BASE,
    });

    const res = await fetch(`${API_BASE}/api/messages/read/all`, {
      method: 'GET',
      headers: {
        Authorization: token ?? '',
      },
    });

    console.log('[받은 쪽지 전체 조회 프록시] 백엔드 응답:', {
      status: res.status,
      statusText: res.statusText,
    });

    const text = await res.text();
    console.log('[받은 쪽지 전체 조회 프록시] 백엔드 응답 텍스트:', text);

    if (!res.ok) {
      let errorMessage = '받은 쪽지 조회 실패';
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      return NextResponse.json(
        { message: errorMessage },
        { status: res.status }
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch (parseError) {
      console.error('[받은 쪽지 전체 조회 프록시] JSON 파싱 실패:', parseError);
      return NextResponse.json({ message: '응답 파싱 실패' }, { status: 500 });
    }
  } catch (err) {
    console.error('[받은 쪽지 전체 조회 프록시 오류]', err);
    return NextResponse.json(
      {
        message: '받은 쪽지 조회 중 오류가 발생했습니다.',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
