import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 일정 수정 (PUT)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  const token = req.headers.get('authorization');
  const API_BASE = process.env.API_BASE_URL;

  if (!API_BASE) {
    return NextResponse.json({ message: 'API 주소 누락' }, { status: 500 });
  }

  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ?? '',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { message: text || '일정 수정 실패' },
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
        message: '일정 수정 중 오류',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// 일정 삭제 (DELETE)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  const token = req.headers.get('authorization');
  const API_BASE = process.env.API_BASE_URL;

  if (!API_BASE) {
    return NextResponse.json({ message: 'API 주소 누락' }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_BASE}/api/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ?? '',
      },
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { message: text || '일정 삭제 실패' },
        { status: res.status }
      );
    }

    if (text) {
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data, { status: res.status });
      } catch {
        return NextResponse.json(
          { message: '일정이 삭제되었습니다.' },
          { status: res.status }
        );
      }
    }

    return NextResponse.json(
      { message: '일정이 삭제되었습니다.' },
      { status: res.status }
    );
  } catch (err) {
    return NextResponse.json(
      {
        message: '일정 삭제 중 오류',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
