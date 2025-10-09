import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const API_BASE = process.env.API_BASE_URL;
  const token = req.headers.get('authorization');

  if (!API_BASE) {
    return NextResponse.json(
      { message: 'API_BASE_URL is not defined' },
      { status: 500 }
    );
  }

  if (!token || !token.startsWith('Bearer')) {
    return NextResponse.json(
      { message: '인증 토큰이 없습니다.' },
      { status: 401 }
    );
  }

  try {
    console.log('[그룹 API] 백엔드 요청:', {
      url: `${API_BASE}/api/groups/mygroups`,
      hasToken: Boolean(token),
      tokenStart: token?.substring(0, 20) + '...',
    });

    const res = await fetch(`${API_BASE}/api/groups/mygroups`, {
      headers: {
        Authorization: token,
      },
    });

    console.log('[그룹 API] 백엔드 응답:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
    });

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      const text = await res.text();
      console.error('[프록시] 백엔드 응답 에러:', res.status, text);
      return NextResponse.json(
        { message: `Backend responded with status ${res.status}` },
        { status: res.status }
      );
    }

    if (contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      console.error('JSON 아님:', text);
      return NextResponse.json(
        { message: 'Invalid content type from backend' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Proxy Error]', error);
    return NextResponse.json(
      { message: 'Failed to fetch group list' },
      { status: 500 }
    );
  }
}
