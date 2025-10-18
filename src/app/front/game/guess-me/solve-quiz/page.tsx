'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import axios from '@/libs/axios';
import { isAxiosError } from 'axios';
import Button from '@/components/common/Button';

interface Message {
  messageId: number;
  sender: string;
  receiver: string;
  content: string;
  sendTime: string;
  readStatus: boolean;
  senderDeleted: boolean;
  receiverDeleted: boolean;
}

function MessageDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageId = searchParams.get('id');
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessage = async () => {
      if (!messageId) {
        setError('쪽지 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/messages/read/${messageId}`);
        setMessage(response.data);

        try {
          await axios.patch(`/api/messages/read/${messageId}`);
        } catch {
          // 읽음 처리 실패는 사용자에게 알리지 않음
        }
      } catch (err: unknown) {
        let errorMessage = '쪽지를 불러오지 못했습니다.';

        if (isAxiosError(err)) {
          if (
            err.response?.status === 500 &&
            err.response?.data?.message ===
              '해당 쪽지에 대한 접근 권한이 없습니다.'
          ) {
            errorMessage = '이 쪽지에 대한 접근 권한이 없습니다.';
          } else {
            errorMessage =
              (err.response?.data as { message?: string })?.message ||
              errorMessage;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessage();
  }, [messageId]);

  const handleDelete = async () => {
    if (!messageId) return;

    const isConfirmed = confirm('쪽지를 삭제하시겠습니까?');

    if (isConfirmed) {
      try {
        await axios.delete(`/api/messages/${messageId}`);
        alert('쪽지가 삭제되었습니다.');
        router.push('/front/message/list');
      } catch {
        alert('쪽지 삭제에 실패했습니다.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="my-home-page py-4 px-4 pt-20 pb-28 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
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
          <h1 className="text-2xl font-semibold text-center w-full">
            쪽지 상세
          </h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">⏳</div>
            <p className="text-gray-600">쪽지를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="my-home-page py-4 px-4 pt-20 pb-28 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
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
          <h1 className="text-2xl font-semibold text-center w-full">
            쪽지 상세
          </h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center py-12">
            <div className="text-red-400 text-6xl mb-4">❌</div>
            <p className="text-red-600 mb-2">
              {error || '쪽지를 찾을 수 없습니다.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-home-page py-4 px-4 pt-20 pb-28 mx-auto rounded-lg bg-gray-100 min-h-screen">
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
        <h1 className="text-2xl font-semibold text-center w-full">
          보낸 사람: {message.sender}
        </h1>
      </div>

      {/* 쪽지 내용 */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">쪽지 내용</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {new Date(message.sendTime).toLocaleString()}
            </span>
            {!message.readStatus && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                읽지 않음
              </span>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
          <div className="text-gray-800 whitespace-pre-line leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.push('/front/message/list')}
          >
            목록으로
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-red-600"
            onClick={handleDelete}
          >
            삭제하기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MessageDetail() {
  return (
    <Suspense
      fallback={
        <div className="my-home-page py-4 px-4 pt-20 pb-28 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
          <div className="relative mb-6 min-h-[40px] flex items-center justify-center">
            <h1 className="text-2xl font-semibold text-center w-full">
              쪽지 상세
            </h1>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          </div>
        </div>
      }
    >
      <MessageDetailContent />
    </Suspense>
  );
}
