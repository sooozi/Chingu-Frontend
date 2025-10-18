'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';
import { AxiosError } from 'axios';

interface FriendRequest {
  fromUserId: number;
  nickname: string;
  requestedAt: string;
}

export default function FriendRequestsPage() {
  const router = useRouter();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState<number | null>(null);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/friends/requests');
        setFriendRequests(response.data);
      } catch (err) {
        console.error(err);
        setError('받은 친구 요청을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchFriendRequests();
  }, []);

  const handleRespond = async (
    friendId: number,
    status: 'accepted' | 'rejected'
  ) => {
    try {
      setResponding(friendId);

      const response = await axiosInstance.put('/api/friends/respond', {
        friendId,
        status,
      });

      console.log('친구 요청 응답 성공:', response.data);

      // 성공 시 목록에서 제거
      setFriendRequests((prev) =>
        prev.filter((req) => req.fromUserId !== friendId)
      );

      // 성공 알림
      alert(
        status === 'accepted'
          ? '친구 요청 수락이 완료되었습니다!'
          : '친구 요청을 거절했습니다.'
      );

      // 수락한 경우 마이홈으로 이동
      if (status === 'accepted') {
        router.push('/front/my-home');
      }
    } catch (err) {
      console.error('친구 요청 응답 실패:', err);

      if (err instanceof AxiosError) {
        console.error('에러 응답 데이터:', err.response?.data);
        console.error('에러 상태 코드:', err.response?.status);

        // 에러 메시지 표시
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          '요청 처리에 실패했습니다.';
        alert(`에러: ${errorMessage}`);
      } else {
        alert('요청 처리에 실패했습니다.');
      }
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        받은 친구 요청을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="my-home-page py-4 px-4 pt-10 pb-10 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
      <div className="relative mb-6 min-h-[40px] flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800 absolute left-0 top-1/2 -translate-y-1/2"
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
        <h2 className="text-2xl font-semibold text-center w-full">
          받은 친구 요청
        </h2>
      </div>

      {friendRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📭</div>
          <div className="text-gray-500 font-medium">
            받은 친구 요청이 없습니다.
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {friendRequests.map((request) => (
            <li
              key={request.fromUserId}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-5 py-4"
            >
              <div>
                <span className="font-semibold text-lg text-gray-800">
                  {request.nickname}
                </span>
                <div className="text-sm text-gray-500 mt-1">
                  요청일: {new Date(request.requestedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleRespond(request.fromUserId, 'accepted')}
                  disabled={responding === request.fromUserId}
                  className={`text-white text-sm px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                    responding === request.fromUserId
                      ? 'bg-gray-400 cursor-not-allowed opacity-70'
                      : 'bg-[#9477ff] hover:bg-[#6845f5] hover:shadow-md'
                  }`}
                >
                  수락
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(request.fromUserId, 'rejected')}
                  disabled={responding === request.fromUserId}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95 border ${
                    responding === request.fromUserId
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-70'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                  }`}
                >
                  거절
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
