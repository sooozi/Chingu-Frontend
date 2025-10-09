'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useState } from 'react';
import React from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const FindIdSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('유효한 이메일을 입력해주세요'),
});

type FindIdFormValues = z.infer<typeof FindIdSchema>;

export default function FindIdPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FindIdFormValues>({
    resolver: zodResolver(FindIdSchema),
  });

  const [foundId, setFoundId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const onSubmit = async (data: FindIdFormValues) => {
    try {
      setError('');
      setFoundId(null);

      const response = await axios.get('/api/auth/find-id', {
        params: {
          name: data.name,
          email: data.email,
        },
      });

      if (response.data?.userId) {
        setFoundId(response.data.userId);
      } else {
        setError(response.data?.message || '일치하는 정보가 없습니다.');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || '아이디 찾기 실패');
      } else {
        setError('예상치 못한 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div
      className="find-id-page relative h-full flex flex-col items-center justify-center overflow-hidden tracking-tight py-4 px-4"
      style={{ letterSpacing: '-0.5px' }}
    >
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100"></div>

      {/* 애니메이션 배경 요소들 */}
      <div className="absolute top-10 left-6 w-32 h-32 bg-purple-200 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-10 right-8 w-24 h-24 bg-blue-200 rounded-full opacity-40 animate-pulse delay-1000"></div>
      <div className="absolute top-1/3 right-0 w-16 h-16 bg-pink-200 rounded-full opacity-30 animate-pulse delay-700"></div>
      <div className="absolute bottom-1/4 left-0 w-20 h-20 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      <div
        className="absolute top-1/2 left-1/2 w-12 h-12 bg-yellow-100 rounded-full opacity-20 animate-pulse delay-300"
        style={{ transform: 'translate(-50%, -50%)' }}
      ></div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* 헤더 */}
        <div className="text-center space-y-4 mb-12 animate-slideUp opacity-0">
          <h2 className="text-3xl text-black drop-shadow-sm font-bold">
            아이디 찾기
          </h2>
        </div>

        {/* 아이디 찾기 폼 */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="animate-slideUp delay-300 opacity-0"
        >
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="이름을 입력하세요"
              {...register('name')}
              className="w-full h-10 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
              style={
                {
                  '--focus-ring-color': '#6845f5',
                } as React.CSSProperties
              }
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px #6845f5';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            />
            <p className="absolute top-[35px] left-0 mt-1 text-xs text-red-500 transition-opacity duration-200">
              {errors.name?.message ?? ''}
            </p>
          </div>

          <div className="relative mb-6">
            <Input
              type="email"
              placeholder="이메일을 입력하세요"
              {...register('email')}
              className="w-full h-10 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
              style={
                {
                  '--focus-ring-color': '#6845f5',
                } as React.CSSProperties
              }
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px #6845f5';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            />
            <p className="absolute top-[35px] left-0 mt-1 text-xs text-red-500 transition-opacity duration-200">
              {errors.email?.message ?? ''}
            </p>
          </div>

          <div className="animate-slideUp delay-600 opacity-0">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
            >
              아이디 찾기
            </Button>
          </div>
        </form>

        {/* 결과 메시지 */}
        {foundId && (
          <div className="mt-6 text-center animate-slideUp">
            <p className="text-green-600 font-semibold">
              회원님의 아이디는{' '}
              <strong className="text-main-color">{foundId}</strong>입니다.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 text-center animate-slideUp">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center animate-slideUp delay-1000 opacity-0">
          <Button
            type="button"
            onClick={() => router.push('/front/account/login')}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
          >
            로그인하기
          </Button>
        </div>
      </div>
    </div>
  );
}
