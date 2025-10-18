'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';
import Link from 'next/link';

interface Friend {
  friendUserId: number;
  id: string;
  nickname: string;
  name: string;
  score: number;
  friendSince: string;
}

export default function FriendListPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/friends');
        setFriends(response.data);
      } catch (err) {
        console.error(err);
        setError('친구 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500">
        친구 목록을 불러오는 중...
      </div>
    );
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-lg mx-auto py-4 px-4 pt-20 pb-28">
      {/* 뒤로가기 버튼과 타이틀 */}
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
          친구 리스트
        </h2>
      </div>
      {friends.length === 0 ? (
        <div className="text-gray-400 text-center">아직 친구가 없습니다.</div>
      ) : (
        <ul className="space-y-3">
          {friends.map((friend) => (
            <li
              key={friend.friendUserId}
              className="flex items-center justify-between bg-white border rounded-lg shadow-sm px-4 py-3 hover:bg-[#aa96fc] hover:bg-opacity-10 transition"
            >
              <div>
                <span className="font-semibold text-lg">{friend.nickname}</span>
                <span className="ml-2 text-gray-500 text-sm">
                  ({friend.name})
                </span>
                <span className="ml-3 text-xs text-gray-400">
                  친구맺은 날짜:{' '}
                  {new Date(friend.friendSince).toLocaleDateString()}
                </span>
              </div>
              <Link
                href={`/front/my-home/friend/${friend.id}`}
                className="main-color hover:underline text-sm font-medium"
              >
                프로필
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
