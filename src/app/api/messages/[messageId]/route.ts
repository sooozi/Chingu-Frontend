import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 쪽지 삭제 (DELETE)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const token = req.headers.get('authorization');
  const API_BASE = process.env.API_BASE_URL;

  if (!API_BASE) {
    return NextResponse.json({ message: 'API 주소 누락' }, { status: 500 });
  }

  if (!messageId) {
    return NextResponse.json({ message: 'messageId 누락' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json(
      { message: '인증 토큰이 필요합니다' },
      { status: 401 }
    );
  }

  try {
    console.log('[쪽지 삭제 프록시] 요청 데이터:', {
      messageId,
      token: token ? `${token.substring(0, 20)}...` : 'null',
      API_BASE,
    });

    const res = await fetch(`${API_BASE}/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: token,
      },
    });

    console.log('[쪽지 삭제 프록시] 백엔드 응답:', {
      status: res.status,
      statusText: res.statusText,
    });

    const text = await res.text();
    console.log('[쪽지 삭제 프록시] 백엔드 응답 텍스트:', text);

    if (!res.ok) {
      let errorMessage = '쪽지 삭제 실패';
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

    // 삭제 성공 시 빈 응답일 수 있으므로 처리
    if (text) {
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data, { status: res.status });
      } catch (parseError) {
        console.error('[쪽지 삭제 프록시] JSON 파싱 실패:', parseError);
        // 빈 응답이거나 JSON이 아닐 경우 성공 메시지 반환
        return NextResponse.json(
          { message: '쪽지가 삭제되었습니다.' },
          { status: res.status }
        );
      }
    } else {
      return NextResponse.json(
        { message: '쪽지가 삭제되었습니다.' },
        { status: res.status }
      );
    }
  } catch (err) {
    console.error('[쪽지 삭제 프록시 오류]', err);
    return NextResponse.json(
      {
        message: '쪽지 삭제 중 오류가 발생했습니다.',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
