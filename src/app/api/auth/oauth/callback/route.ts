import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('[OAuth 콜백]', { code, state, error });

  if (error) {
    console.error('[OAuth 오류]', error);
    return NextResponse.redirect(
      new URL('/front/account/login?error=oauth_error', req.url)
    );
  }

  if (!code) {
    console.error('[OAuth 코드 누락]');
    return NextResponse.redirect(
      new URL('/front/account/login?error=no_code', req.url)
    );
  }

  try {
    // 백엔드로 OAuth 코드 전달하여 토큰 교환
    const API_BASE = process.env.API_BASE_URL;
    const oauthUrl = `${API_BASE}/auth/oauth/callback?code=${code}&state=${state}`;

    console.log('[OAuth 백엔드 요청]', {
      url: oauthUrl,
      method: 'GET',
      hasCode: Boolean(code),
      hasState: Boolean(state),
    });

    const response = await fetch(oauthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[OAuth 백엔드 응답]', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      console.error('[OAuth 토큰 교환 실패]', response.status);
      return NextResponse.redirect(
        new URL('/front/account/login?error=token_exchange_failed', req.url)
      );
    }

    const data = await response.json();
    console.log('[OAuth 토큰 교환 성공]', {
      hasAccessToken: Boolean(data.accessToken),
      tokenLength: data.accessToken?.length,
      tokenStart: data.accessToken?.substring(0, 20) + '...',
      socialType: data.socialType,
      fullData: data,
    });

    // 토큰 유효성 검증을 위한 추가 로깅
    if (data.accessToken) {
      try {
        const tokenParts = data.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('[OAuth 토큰 페이로드]', {
            sub: payload.sub,
            id: payload.id,
            nickname: payload.nickname,
            iat: payload.iat,
            exp: payload.exp,
            expDate: new Date(payload.exp * 1000).toISOString(),
          });
        }
      } catch (e) {
        console.error('[OAuth 토큰 파싱 오류]', e);
      }
    }

    // 토큰을 쿠키로 설정하고 메인 페이지로 리다이렉트
    const socialType = data.socialType || 'oauth';
    const redirectResponse = NextResponse.redirect(
      new URL(`/front/my-home?socialType=${socialType}`, req.url)
    );

    if (data.accessToken) {
      redirectResponse.cookies.set('accessToken', data.accessToken, {
        path: '/',
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7일
      });

      // OAuth 로그인 시 소셜 타입 쿠키도 설정
      redirectResponse.cookies.set('loginType', socialType, {
        path: '/',
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7일 (accessToken과 동일)
      });

      console.log('[OAuth 콜백] 설정된 socialType:', socialType);
    }

    return redirectResponse;
  } catch (error) {
    console.error('[OAuth 콜백 처리 오류]', error);
    return NextResponse.redirect(
      new URL('/front/account/login?error=callback_error', req.url)
    );
  }
}
