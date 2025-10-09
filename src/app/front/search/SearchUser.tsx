'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/common/Button';
import { getCookieValue } from '@/utils/cookie';

type User = {
  id: number;
  name: string;
  nickname: string;
  profilePictureUrl: string;
  isFriend: boolean;
};

export default function SearchUser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';

  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [requestingFriends, setRequestingFriends] = useState<Set<number>>(
    new Set()
  );

  const getToken = () => getCookieValue('accessToken');

  useEffect(() => {
    const token = getToken(); // 친구목록/친구신청만 사용

    const search = async () => {
      if (!keyword.trim()) {
        setUsers([]);
        setErrorMsg('친구의 이름 또는 닉네임을 입력해주세요.');
        return;
      }

      setIsSearching(true);
      setErrorMsg('');

      // 토큰이 없으면 로그인 페이지로 이동
      if (!token) {
        setErrorMsg('로그인이 필요합니다.');
        setIsSearching(false);
        router.replace('/front/account/login');
        return;
      }

      try {
        const url = `/api/users/search?keyword=${encodeURIComponent(keyword)}`;
        console.log('[검색 요청]', {
          url,
          hasToken: Boolean(token),
          tokenLength: token?.length,
          tokenStart: token?.substring(0, 20) + '...',
        });

        // Authorization 헤더 포함 요청
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('[검색 응답]', {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        });

        const data = await res.json();

        if (res.ok) {
          const sorted: User[] = (data.users ?? []).sort((a: User, b: User) =>
            (a.nickname ?? '').localeCompare(b.nickname ?? '')
          );
          console.log('[검색 결과] 정렬된 사용자 목록:', sorted);

          // 로그인 시 친구 목록업데이트
          try {
            if (token) {
              const friendsResponse = await fetch('/api/friends', {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (friendsResponse.ok) {
                const friendsData: Array<{ friendUserId: number }> =
                  await friendsResponse.json();
                const updatedUsers = sorted.map((user) => ({
                  ...user,
                  isFriend: friendsData.some((f) => f.friendUserId === user.id),
                }));
                setUsers(updatedUsers);
              } else {
                setUsers(sorted);
              }
            } else {
              setUsers(sorted);
            }
          } catch (friendsError) {
            console.error('[친구 목록 조회 실패]', friendsError);
            setUsers(sorted);
          }

          if (sorted.length === 0) {
            setErrorMsg('찾으시는 친구가 없어요');
          }
        } else {
          setErrorMsg(data.message || '검색에 실패했습니다.');
        }
      } catch (err) {
        console.error('[유저 검색 실패]', err);
        setErrorMsg('검색 중 오류가 발생했습니다.');
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [keyword, router]);

  const handleFriendRequest = async (friendId: number) => {
    const token = getToken();

    if (!token) {
      alert('로그인이 필요합니다.');
      router.replace('/front/account/login');
      return;
    }

    // 요청 중복 방지
    if (requestingFriends.has(friendId)) return;

    try {
      setRequestingFriends((prev) => new Set(prev).add(friendId));

      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('친구 신청이 완료되었습니다!');
        setUsers((prev) =>
          prev.map((u) => (u.id === friendId ? { ...u, isFriend: true } : u))
        );
      } else {
        if (data.message === '이미 친구입니다.') {
          setUsers((prev) =>
            prev.map((u) => (u.id === friendId ? { ...u, isFriend: true } : u))
          );
        }
        alert(data.message || '친구 신청에 실패했습니다.');
      }
    } catch (error) {
      console.error('[친구 신청 오류]', error);
      alert('친구 신청 중 오류가 발생했습니다.');
    } finally {
      setRequestingFriends((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  return (
    <div className="search-user-page py-24 px-4 bg-gray-100 min-h-screen">
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
        <h2 className="text-2xl font-semibold text-center flex-1">유저 찾기</h2>
      </div>

      <div className="users-wrap scroll-overlay h-[calc(84px*7)] overflow-y-auto overflow-x-hidden flex flex-col gap-3 bg-white p-4 rounded-lg shadow-sm">
        {isSearching && (
          <p className="text-center text-sm text-gray-400">검색 중입니다...</p>
        )}

        {!isSearching && errorMsg && (
          <p className="text-center text-sm text-gray-500 m-2">{errorMsg}</p>
        )}

        <div className="user-item">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between bg-white p-3 rounded-md shadow-md border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={user.profilePictureUrl || '/images/default-profile.png'}
                  alt="프로필"
                  width={48}
                  height={48}
                  className="rounded-full border object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-800">{user.nickname}</p>
                  <p className="text-sm text-gray-500">{user.name}</p>
                </div>
              </div>

              {user.isFriend ? (
                <Link
                  href={`/front/my-home?userId=${user.id}`}
                  className="px-4 py-3 rounded-lg transition-colors bg-main-color text-white small-ver bg-gray-300 text-sm"
                >
                  칭구칭구🫶
                </Link>
              ) : (
                <Button
                  type="button"
                  className={`small-ver text-sm ${
                    requestingFriends.has(user.id)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  onClick={() => handleFriendRequest(user.id)}
                  disabled={requestingFriends.has(user.id)}
                >
                  {requestingFriends.has(user.id) ? '신청 중...' : '친구 신청'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
