'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';

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

// UTC 시간을 한국 시간으로 변환하는 함수
const formatToKoreanTime = (utcTimeString: string) => {
  // UTC 시간을 Date 객체로 변환
  const date = new Date(utcTimeString);

  // 한국 시간은 UTC+9이므로 9시간을 추가
  const koreanTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  // 한국 시간대로 포맷팅
  const year = koreanTime.getFullYear();
  const month = String(koreanTime.getMonth() + 1).padStart(2, '0');
  const day = String(koreanTime.getDate()).padStart(2, '0');
  let hour = koreanTime.getHours();
  const minute = String(koreanTime.getMinutes()).padStart(2, '0');
  const period = hour >= 12 ? '오후' : '오전';

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  return `${year}. ${month}. ${day}. ${period} ${String(hour).padStart(2, '0')}:${minute}`;
};

export default function MessageList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'sent') {
          const res = await axiosInstance.get('/api/messages/sent');
          setSentMessages(res.data);
        } else {
          const res = await axiosInstance.get('/api/messages/read/all');
          setReceivedMessages(res.data);
        }
      } catch {
        alert('쪽지 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [activeTab]);

  const messages = activeTab === 'sent' ? sentMessages : receivedMessages;

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
          나의 쪽지함
        </h2>
      </div>

      <div className="flex mb-4 gap-2">
        <button
          className={`flex-1 py-2 text-center rounded-lg ${
            activeTab === 'received' ? 'bg-main-color text-white' : 'bg-white'
          }`}
          onClick={() => setActiveTab('received')}
        >
          받은 쪽지
        </button>
        <button
          className={`flex-1 py-2 text-center rounded-lg ${
            activeTab === 'sent' ? 'bg-main-color text-white' : 'bg-white'
          }`}
          onClick={() => setActiveTab('sent')}
        >
          보낸 쪽지
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center text-gray-500">쪽지를 불러오는 중...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">쪽지가 없습니다.</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.messageId}
              className={`bg-white p-4 rounded-lg shadow-sm ${
                activeTab === 'received'
                  ? 'cursor-pointer hover:bg-gray-50'
                  : ''
              }`}
              onClick={() => {
                if (activeTab === 'received') {
                  router.push(`/front/message/detail?id=${message.messageId}`);
                }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 text-sm">
                  {activeTab === 'sent'
                    ? `받는 사람: ${message.receiver}`
                    : `보낸 사람: ${message.sender}`}
                </div>
                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {formatToKoreanTime(message.sendTime)}
                </div>
              </div>
              <div className="text-gray-800 mb-2 font-medium">
                {message.content.length > 80
                  ? `${message.content.substring(0, 80)}...`
                  : message.content}
              </div>
              {activeTab === 'received' && (
                <div className="text-xs">
                  {message.readStatus ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      읽음
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      읽지 않음
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
