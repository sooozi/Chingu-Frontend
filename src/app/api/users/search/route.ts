import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const API_BASE = process.env.API_BASE_URL;
  const token = req.headers.get('authorization');
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword');

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
    const url = keyword
      ? `${API_BASE}/api/users/search?keyword=${encodeURIComponent(keyword)}`
      : `${API_BASE}/api/users/search`;

    console.log('[검색 API] 백엔드 요청:', {
      url,
      hasToken: Boolean(token),
      tokenStart: token?.substring(0, 20) + '...',
    });

    // 토큰 상세 분석
    if (token) {
      try {
        const tokenParts = token.replace('Bearer ', '').split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('[검색 API] 토큰 페이로드:', {
            sub: payload.sub,
            id: payload.id,
            nickname: payload.nickname,
            iat: payload.iat,
            exp: payload.exp,
            expDate: new Date(payload.exp * 1000).toISOString(),
            isExpired: Date.now() > payload.exp * 1000,
          });
        }
      } catch (e) {
        console.error('[검색 API] 토큰 파싱 오류:', e);
      }
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    });

    console.log('[검색 API] 백엔드 응답:', {
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
      { message: '회원 검색 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
