import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const API_BASE = process.env.API_BASE_URL;
  const token = req.headers.get('authorization');

  if (!API_BASE) {
    return NextResponse.json({ error: 'API_BASE_URL 누락됨' }, { status: 500 });
  }

  if (!token) {
    return NextResponse.json(
      { error: '인증 토큰이 필요합니다' },
      { status: 401 }
    );
  }

  try {
    const backendUrl = new URL('/api/admin/check', API_BASE).toString();

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: token,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        {
          error: '관리자 권한 확인 실패',
          details: errorText,
          status: res.status,
        },
        { status: res.status }
      );
    }

    // 응답이 JSON인지 텍스트인지 확인
    const contentType = res.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      // 텍스트 응답인 경우
      const text = await res.text();
      // 텍스트를 JSON으로 감싸서 반환
      return NextResponse.json({ message: text, isAdmin: true });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: '서버 오류', details: errorMessage },
      { status: 500 }
    );
  }
}
