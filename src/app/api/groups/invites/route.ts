import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const API_BASE = process.env.API_BASE_URL;
  const token = req.headers.get('authorization');

  if (!API_BASE) {
    return NextResponse.json({ error: 'API_BASE_URL 누락됨' }, { status: 500 });
  }

  if (!token || !token.startsWith('Bearer')) {
    return NextResponse.json(
      { message: '인증 토큰이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { groupId, toUserId } = body;

    if (
      groupId === undefined ||
      groupId === null ||
      toUserId === undefined ||
      toUserId === null
    ) {
      return NextResponse.json(
        { message: 'groupId와 toUserId가 모두 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('[그룹 초대 요청]', { groupId, toUserId });

    // 올바른 백엔드 API 엔드포인트 사용
    const attempts = [
      () =>
        fetch(`${API_BASE}/api/groups/${groupId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          body: JSON.stringify({ friendUserIds: [toUserId] }),
        }),
    ];

    let res: Response | undefined;

    for (const attempt of attempts) {
      try {
        res = await attempt();
        console.log('[그룹 초대 응답]', res.status, res.statusText);
        if (res.ok) {
          console.log('[그룹 초대 성공] 사용된 메서드:', res.url);
          break;
        }
      } catch (error) {
        console.log('[그룹 초대 시도 실패]', error);
      }
    }

    if (!res) {
      throw new Error('모든 HTTP 메서드 시도 실패');
    }

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ message: '그룹 초대 실패' }));
      console.error('[그룹 초대 오류]', errorData);
      return NextResponse.json(
        { message: errorData.message || '그룹 초대에 실패했습니다.' },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log('[그룹 초대 성공]', data);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[그룹 초대 오류]', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '그룹 초대 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const API_BASE = process.env.API_BASE_URL;
  const token = req.headers.get('authorization');

  if (!API_BASE) {
    return NextResponse.json({ error: 'API_BASE_URL 누락됨' }, { status: 500 });
  }

  if (!token || !token.startsWith('Bearer')) {
    return NextResponse.json(
      { message: '인증 토큰이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    console.log('[초대 API] 백엔드 요청:', {
      url: `${API_BASE}/api/groups/invites`,
      hasToken: Boolean(token),
      tokenStart: token?.substring(0, 20) + '...',
    });

    const res = await fetch(`${API_BASE}/api/groups/invites`, {
      method: 'GET',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    });

    console.log('[초대 API] 백엔드 응답:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: '초대 목록 조회 실패' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API ERROR] 초대 목록 조회 실패:', error);
    return NextResponse.json(
      { message: '서버 오류로 초대 목록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
