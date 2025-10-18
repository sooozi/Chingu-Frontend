'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { getCookieValue } from '@/utils/cookie';

type Friend = {
  friendUserId: number;
  nickname: string;
  name: string;
  score?: number;
  friendSince?: string;
};

export default function GroupAdd() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      const token = getCookieValue('accessToken');

      if (!token) {
        alert('로그인이 필요합니다.');
        router.push('/front/account/login');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/friends', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('친구 목록 조회 실패');
        }

        const data: Friend[] = await response.json();
        console.log('[친구 목록 조회 성공]', data);
        setFriends(data);
      } catch (err) {
        console.error('[친구 목록 조회 오류]', err);
        setError('친구 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [router]);

  const handleCheck = (userId: number) => {
    setSelectedFriendIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 중복 제출 방지
    if (isSubmitting) {
      return;
    }

    const token = getCookieValue('accessToken');

    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/front/account/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupName,
          description,
          invitedFriendIds: selectedFriendIds,
        }),
      });

      if (!res.ok) throw new Error('그룹 생성 실패');

      const createdGroup = await res.json();
      console.log('[생성된 그룹 정보]', createdGroup);
      alert(`'${createdGroup.groupName}' 그룹이 생성되었습니다!`);
      router.push('/front/my-home/group-list');
    } catch (err) {
      console.error('[그룹 생성 실패]', err);
      alert('그룹 생성 중 문제가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group-add-page py-24 px-4 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
      <div className="flex items-center mb-6">
        <button
          type="button"
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
            aria-hidden="true"
            focusable="false"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <h2 className="text-2xl font-semibold text-center flex-1">
          내 그룹 생성
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 그룹명 입력 */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm gap-2">
          <label className="block mb-1 font-medium">그룹명</label>
          <Input
            type="text"
            placeholder="그룹명 입력"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        {/* 그룹 설명 입력 */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm gap-2">
          <label className="block mb-1 font-medium">그룹 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="그룹 설명 입력"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-[#f3f3f5] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        </div>

        {/* 친구 선택 */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm gap-2">
          <p className="mb-1 font-medium">그룹으로 초대할 친구 선택</p>
          <div className="border p-3 rounded max-h-40 overflow-y-auto space-y-1">
            {loading ? (
              <p className="text-gray-400 text-sm text-center">
                친구 목록을 불러오는 중...
              </p>
            ) : error ? (
              <p className="text-red-500 text-sm text-center">{error}</p>
            ) : friends.length === 0 ? (
              <p className="text-gray-400 text-sm text-center">
                초대 가능한 친구가 없습니다.
              </p>
            ) : (
              friends.map((friend) => (
                <label
                  key={friend.friendUserId}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFriendIds.includes(friend.friendUserId)}
                    onChange={() => handleCheck(friend.friendUserId)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{friend.nickname}</span>
                    <span className="ml-2 text-gray-500 text-sm">
                      ({friend.name})
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedFriendIds.length > 0 && (
            <p className="text-sm text-blue-600 mt-2">
              {selectedFriendIds.length}명의 친구를 선택했습니다.
            </p>
          )}
        </div>

        {/* 그룹 추가 버튼 */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '생성 중...' : '그룹 추가'}
        </Button>
      </form>
    </div>
  );
}
