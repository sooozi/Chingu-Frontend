'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCookieValue } from '@/utils/cookie';

type Group = {
  groupId: number;
  groupName: string;
  description: string;
  createdAt: string;
};

type InviteGroup = {
  requestId: number;
  groupId: number;
  friendUserId: number;
  nickname: string;
  name: string;
  requestStatus: string;
  createdAt: string;
};

export default function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<InviteGroup[]>([]);
  // 더보기 기능 제거 - 모든 항목을 처음부터 표시
  const [error] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  // 그룹 목록 조회 함수
  const fetchGroups = async () => {
    const token = getCookieValue('accessToken');
    console.log('[그룹 조회] 토큰:', token ? '존재' : '없음');
    console.log('[그룹 조회] 토큰 값:', token);

    if (!token) {
      console.error('[그룹 조회] 토큰이 없습니다.');
      return;
    }

    try {
      const res = await fetch('/api/groups/mygroups', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[그룹 조회] 응답 상태:', res.status);

      if (!res.ok) {
        console.error('[그룹 조회] 응답 실패:', res.status, res.statusText);
        throw new Error('그룹 목록 조회 실패');
      }

      const data = await res.json();
      setGroups(data);
      console.log('[그룹 목록 갱신]', data);
    } catch (err) {
      console.error('[그룹 목록 조회 오류]', err);
    }
  };

  // 초대 목록 조회 함수
  const fetchInvites = async () => {
    const token = getCookieValue('accessToken');
    console.log('[초대 조회] 토큰:', token ? '존재' : '없음');
    console.log('[초대 조회] 토큰 값:', token);

    if (!token) {
      console.error('[초대 조회] 토큰이 없습니다.');
      return;
    }

    try {
      const res = await fetch('/api/groups/invites', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[초대 조회] 응답 상태:', res.status);

      if (!res.ok) {
        console.error('[초대 조회] 응답 실패:', res.status, res.statusText);
        throw new Error('초대 목록 조회 실패');
      }

      const data = await res.json();
      setInvites(data);
      setRefreshKey((prev) => prev + 1); // 강제 리렌더링
      console.log('[초대 목록 갱신]', data);
      console.log(
        '[필터링된 초대 목록]',
        data.filter(
          (invite: { requestStatus: string }) =>
            invite.requestStatus !== 'ACCEPTED'
        )
      );
    } catch (err) {
      console.error('[초대 목록 조회 오류]', err);
    }
  };

  useEffect(() => {
    const token = getCookieValue('accessToken');

    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/front/account/login');
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchGroups(), fetchInvites()]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [router]);

  // 그룹 초대 승인
  const handleInviteAccept = async (requestId: number) => {
    const token = getCookieValue('accessToken');
    if (!token) {
      alert('인증 토큰이 없습니다.');
      return;
    }

    console.log('[초대 승인 시도]', {
      requestId,
      token: token.substring(0, 30) + '...',
    });

    try {
      const res = await fetch('/api/groups/invites/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          status: 'ACCEPTED',
        }),
      });

      console.log('[초대 승인 응답]', {
        status: res.status,
        statusText: res.statusText,
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: '초대 승인 실패' }));
        console.error('[초대 승인 오류]', errorData);

        // 이미 가입된 사용자인 경우 초대 목록에서 제거
        if (
          errorData.message &&
          errorData.message.includes('이미 그룹에 가입된 사용자')
        ) {
          console.log('[이미 가입된 사용자] 초대 목록에서 제거');
          // 즉시 상태 초기화
          setInvites([]);
          setRefreshKey((prev) => prev + 1);
          console.log('[초대 목록 즉시 초기화]');
          alert(
            '이미 해당 그룹에 가입되어 있습니다. 초대 목록에서 제거되었습니다.'
          );
          // 초대 목록 갱신
          fetchInvites();
          return;
        }

        throw new Error(errorData.message || '초대 승인 실패');
      }

      const responseData = await res.json();
      console.log('[초대 승인 성공]', responseData);

      alert('그룹 초대를 승인했습니다.');
      // 초대 목록에서 해당 항목 제거
      setInvites((prev) => {
        const newInvites = prev.filter(
          (invite) => invite.requestId !== requestId
        );
        console.log('[초대 목록 업데이트]', {
          이전: prev.length,
          이후: newInvites.length,
        });
        return newInvites;
      });
      // 초대 목록 갱신
      fetchInvites();
      // 그룹 목록 갱신 (새로 가입한 그룹이 목록에 나타나도록)
      fetchGroups();
    } catch (err) {
      console.error('[초대 승인 실패]', err);
      alert(
        err instanceof Error ? err.message : '초대 승인 중 오류가 발생했습니다.'
      );
    }
  };

  // 그룹 초대 거절
  const handleInviteReject = async (requestId: number) => {
    const token = getCookieValue('accessToken');
    if (!token) {
      alert('인증 토큰이 없습니다.');
      return;
    }

    console.log('[초대 거절 시도]', {
      requestId,
      token: token.substring(0, 30) + '...',
    });

    try {
      const res = await fetch('/api/groups/invites/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          status: 'REJECTED',
        }),
      });

      console.log('[초대 거절 응답]', {
        status: res.status,
        statusText: res.statusText,
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: '초대 거절 실패' }));
        console.error('[초대 거절 오류]', errorData);
        throw new Error(errorData.message || '초대 거절 실패');
      }

      const responseData = await res.json();
      console.log('[초대 거절 성공]', responseData);

      alert('그룹 초대를 거절했습니다.');
      // 초대 목록에서 해당 항목 제거
      setInvites((prev) => {
        const newInvites = prev.filter(
          (invite) => invite.requestId !== requestId
        );
        console.log('[초대 목록 업데이트]', {
          이전: prev.length,
          이후: newInvites.length,
        });
        return newInvites;
      });
      // 초대 목록 갱신
      fetchInvites();
    } catch (err) {
      console.error('[초대 거절 실패]', err);
      alert(
        err instanceof Error ? err.message : '초대 거절 중 오류가 발생했습니다.'
      );
    }
  };

  // 그룹 탈퇴
  const handleGroupDelete = async (groupId: number) => {
    const confirmDelete = confirm('정말로 이 그룹을 탈퇴하시겠습니까?');
    if (!confirmDelete) return;

    const token = getCookieValue('accessToken');
    console.log(
      '[그룹 삭제] 쿠키에서 가져온 토큰:',
      token ? `${token.substring(0, 30)}...` : 'null'
    );

    if (!token) {
      alert('인증 토큰이 없습니다.');
      return;
    }

    try {
      // 토큰에 Bearer가 이미 포함되어 있는지 확인
      const authHeader = token?.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
      console.log(
        '[그룹 삭제] 최종 Authorization 헤더:',
        authHeader ? `${authHeader.substring(0, 30)}...` : 'null'
      );

      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: '그룹 삭제 실패' }));
        throw new Error(errorData.message || '그룹 삭제 실패');
      }

      alert('그룹이 성공적으로 삭제되었습니다.');
      // 그룹 목록에서 해당 그룹 제거
      setGroups((prev) => prev.filter((group) => group.groupId !== groupId));
    } catch (err) {
      console.error('[그룹 삭제 실패]', err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : '그룹 삭제 중 오류가 발생했습니다.';

      // 외래키 제약조건 오류 처리
      if (
        errorMessage.includes('foreign key constraint') ||
        errorMessage.includes('Cannot delete')
      ) {
        alert(
          '그룹에 연결된 데이터가 있어 삭제할 수 없습니다.\n\n가능한 원인:\n• 그룹 스케줄\n• 그룹 앨범\n• 그룹 멤버 정보\n\n백엔드 관리자에게 문의하거나 잠시 후 다시 시도해주세요.'
        );
      } else {
        alert(errorMessage);
      }
    }
  };

  return (
    <div className="group-list-page py-24 px-4 mx-auto rounded-lg bg-gray-100">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
          aria-label="뒤로가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <h2 className="text-2xl font-semibold text-center flex-1">
          내 그룹 목록
        </h2>
      </div>

      <div className="flex justify-end mb-4">
        <Link
          href="/front/my-home/group/add"
          className="text-sm px-3 py-1 bg-[#9477ff] hover:bg-[#6845f5] text-white rounded"
        >
          그룹 생성
        </Link>
      </div>

      {/* 그룹 목록 */}
      <div
        className="group-list bg-white rounded-lg shadow-sm p-4 pr-1 space-y-3 max-h-[calc(90px*3)] overflow-y-auto scroll-overlay"
        style={{ scrollbarGutter: 'stable' }}
      >
        {isLoading ? (
          <div className="text-center text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : groups.length === 0 ? (
          <div className="text-center text-gray-400 text-sm">
            그룹 목록이 없습니다. 그룹을 생성해주세요!
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.groupId}
              className="group-item flex items-center justify-between bg-white py-2 px-3 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
              onClick={() =>
                router.push(
                  `/front/my-home/group/detail?groupId=${group.groupId}`
                )
              }
            >
              <div>
                <div className="font-semibold text-gray-800">
                  {group.groupName}
                </div>
                <div className="text-sm text-gray-500">{group.description}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 버튼 클릭 시 부모 div의 클릭 이벤트 방지
                  handleGroupDelete(group.groupId);
                }}
                className="text-sm px-2 py-1 bg-point2-color text-white rounded hover:bg-red-400"
              >
                그룹 탈퇴
              </button>
            </div>
          ))
        )}
      </div>

      {/* 초대 목록 */}
      <div
        key={refreshKey}
        className="group-vite-list bg-white rounded-lg shadow-sm p-4 mt-10 space-y-3 max-h-[calc(90px*3)] overflow-y-auto scroll-overlay"
      >
        {isLoading ? (
          <p className="text-center text-gray-400 text-sm">불러오는 중...</p>
        ) : invites.filter((invite) => invite.requestStatus !== 'ACCEPTED')
            .length === 0 ? (
          <p className="text-center text-gray-400 text-sm">
            초대된 그룹이 없습니다.
          </p>
        ) : (
          invites
            .filter((invite) => invite.requestStatus !== 'ACCEPTED')
            .map((invite) => (
              <div
                key={invite.requestId}
                className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
              >
                <div className="font-medium text-gray-800">
                  {invite.nickname}님의 그룹
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleInviteReject(invite.requestId)}
                    className="text-xs px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleInviteAccept(invite.requestId)}
                    className="text-xs px-2 py-1 bg-main-color text-white rounded"
                  >
                    승인
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
