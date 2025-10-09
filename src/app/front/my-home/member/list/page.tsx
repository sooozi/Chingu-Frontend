'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import { getCookieValue } from '@/utils/cookie';
import Modal from '@/components/common/Modal';

type Member = {
  userId: number;
  nickname: string;
  name: string;
  email: string;
};

type Friend = {
  friendUserId: number;
  nickname: string;
  name: string;
  score: number;
  friendSince: string;
  profilePictureUrl?: string;
};

export default function MemberDetail() {
  const [members, setMembers] = useState<Member[]>([]);
  const [visibleMembers, setVisibleMembers] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Set<number>>(new Set());
  const [groupId, setGroupId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // URL에서 groupId 가져오기
    const params = new URLSearchParams(window.location.search);
    const id = params.get('groupId');

    if (!id) {
      setError('groupId가 없습니다.');
      setIsLoading(false);
      return;
    }

    setGroupId(id);
    const token = getCookieValue('accessToken');

    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/front/account/login');
      return;
    }

    // 그룹 멤버 목록 조회
    fetch(`/api/groups/${id}/members`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ message: '멤버 목록 조회 실패' }));
          throw new Error(errorData.message || '멤버 목록 조회 실패');
        }
        const data = await res.json();
        console.log('[멤버 목록] API 응답:', data);
        setMembers(data);
      })
      .catch((err) => {
        console.error('[멤버 목록 조회 오류]', err);
        setError(err.message || '멤버 목록을 불러오지 못했습니다.');
      })
      .finally(() => setIsLoading(false));

    // 친구 목록 조회
    fetchFriends(token);
  }, [router]);

  // 친구 목록 조회
  const fetchFriends = async (token: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data);
        console.log('[친구 목록] API 응답:', data);

        // 각 친구의 프로필 이미지 정보 확인
        if (Array.isArray(data)) {
          data.forEach((friend: Friend, index: number) => {
            console.log(`[친구 ${index + 1}]`, {
              nickname: friend.nickname,
              profilePictureUrl: friend.profilePictureUrl,
              hasProfileImage: !!friend.profilePictureUrl,
            });
          });
        }
      }
    } catch (err) {
      console.error('[친구 목록 조회 오류]', err);
    }
  };

  // 그룹 초대 모달 열기
  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  // 친구를 그룹에 초대
  const handleInviteToGroup = async (friend: Friend) => {
    if (!groupId) return;

    const token = getCookieValue('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsInviting(true);

    try {
      const response = await fetch('/api/groups/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: parseInt(groupId),
          toUserId: friend.friendUserId,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: '그룹 초대 실패' }));
        throw new Error(errorData.message || '그룹 초대 실패');
      }

      alert(`${friend.nickname}님을 그룹에 초대했습니다.`);

      // 초대한 친구를 invitedFriends에 추가
      setInvitedFriends((prev) => new Set(prev).add(friend.friendUserId));
    } catch (error) {
      console.error('[그룹 초대 오류]', error);
      alert(
        error instanceof Error
          ? error.message
          : '그룹 초대 중 오류가 발생했습니다.'
      );
    } finally {
      setIsInviting(false);
    }
  };

  // 초대 모달 닫기
  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  return (
    <div className="member-list-page py-24 px-4 mx-auto rounded-lg bg-gray-100 min-h-screen">
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
        <h2 className="text-2xl font-semibold text-center flex-1">멤버 목록</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">그룹 멤버</h3>
          <Button
            type="button"
            onClick={handleOpenInviteModal}
            className="bg-blue-600 text-white text-xs px-2 py-1"
          >
            멤버 초대
          </Button>
        </div>
        <div className="space-y-2 max-h-[530px] overflow-y-auto scroll-overlay">
          {isLoading ? (
            <p className="text-center text-gray-500 text-sm">불러오는 중...</p>
          ) : error ? (
            <div className="text-center text-red-500 text-sm">{error}</div>
          ) : members.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">
              멤버가 없습니다.
            </p>
          ) : (
            members.slice(0, visibleMembers).map((member) => (
              <div
                key={member.userId}
                className="bg-gray-100 px-4 py-3 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="font-medium text-gray-800">
                  {member.nickname}
                  <span className="text-sm text-gray-600 font-normal">
                    ({member.name})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {visibleMembers < members.length && (
          <div className="text-center mt-4">
            <Button
              type="button"
              onClick={() => setVisibleMembers((prev) => prev + 5)}
              className="text-sm text-blue-600 w-full"
            >
              더보기
            </Button>
          </div>
        )}
      </div>

      {/* 친구 초대 모달 */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        title="친구를 그룹에 초대"
      >
        <div className="">
          <div className="max-h-80 overflow-y-auto space-y-3 mb-6 pb-1">
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">친구가 없습니다.</p>
                <p className="text-gray-400 text-xs mt-1">
                  먼저 친구를 추가해주세요.
                </p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.friendUserId}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-gray-800">
                      {friend.nickname}
                    </div>
                    <div className="text-sm text-gray-500">{friend.name}</div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleInviteToGroup(friend)}
                    disabled={
                      isInviting || invitedFriends.has(friend.friendUserId)
                    }
                    className="!px-2 !py-1 bg-point1-color disabled:opacity-50 disabled:cursor-not-allowed !rounded-full transition-colors duration-200"
                  >
                    {invitedFriends.has(friend.friendUserId) ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>초대 중...</span>
                      </div>
                    ) : isInviting ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>초대 중...</span>
                      </div>
                    ) : (
                      '초대'
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={handleCloseInviteModal}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </Modal>
    </div>
  );
}
