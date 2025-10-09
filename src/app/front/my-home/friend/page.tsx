'use client';

import Image from 'next/image';
import Button from '@/components/common/Button';
import { useRouter } from 'next/navigation';

export default function MyHomeFriend() {
  const router = useRouter();

  const handleSendMessage = () => {
    router.push('/front/message/write');
  };

  return (
    <div className="my-home-page py-4 px-4 pt-10 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">친구 마이 홈</h2>

      <div className="profile-card flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm gap-2">
        <div className="flex items-center gap-2">
          <Image
            src="/images/default-profile.jpg"
            alt="프로필 사진"
            width={64}
            height={64}
            priority={true}
            className="object-cover rounded-full border border-gray-300"
          />
          <div className="profile-info">
            <h3 className="text-lg font-semibold">닉네임</h3>
            <p className="text-sm text-gray-500">
              친구 수 <span>20</span>
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-700">
          우정온도 <span className="main-color">90%</span>
        </p>
      </div>

      <div className="profile-intro p-4 bg-white rounded-lg shadow-sm mb-4">
        <p className="text-gray-700">자기소개 멘트</p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button type="button" className="flex-1 text-white">
          친구 끊기
        </Button>
        <Button
          type="button"
          className="flex-1 text-white"
          onClick={handleSendMessage}
        >
          쪽지 보내기
        </Button>
      </div>

      <div className="schedule-calendar bg-white p-6 rounded-lg shadow-sm mb-4 text-center text-gray-500">
        일정 캘린더가 들어갈 부분
      </div>

      <div className="my-groups bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2">내 그룹 목록</h3>
        <div className="group-item bg-gray-200 p-3 rounded mb-2">그룹1</div>
        <div className="group-item bg-gray-200 p-3 rounded mb-2">그룹2</div>
        <div className="group-item bg-gray-200 p-3 rounded">그룹3</div>

        <Button
          type="button"
          className="flex-1 w-full bg-blue-600 text-white mt-4"
        >
          더보기
        </Button>
      </div>
    </div>
  );
}
