'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/common/Button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Input from '@/components/common/Input';
import { getCookieValue } from '@/utils/cookie';

const ChangePwSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: z.string().min(6, '새 비밀번호는 최소 6자 이상이어야 합니다.'),
    confirmPassword: z.string().min(6, '비밀번호 확인은 필수입니다.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

type ChangePwFormValues = z.infer<typeof ChangePwSchema>;

export default function MypageChangePw() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePwFormValues>({
    resolver: zodResolver(ChangePwSchema),
  });

  const onSubmit = async (data: ChangePwFormValues) => {
    const token = getCookieValue('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/front/account/login');
      return;
    }

    try {
      setMessage('');
      setErrorMsg('');

      const res = await fetch('/api/users/mypage/edit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmNewPassword: data.confirmPassword,
        }),
      });

      const contentType = res.headers.get('content-type');
      const result = contentType?.includes('application/json')
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        console.error('[비밀번호 변경 실패]', result);
        setErrorMsg(
          typeof result === 'string'
            ? result
            : result.message || '비밀번호 변경 실패'
        );
        return;
      }

      setMessage('비밀번호가 성공적으로 변경되었습니다.');
      setTimeout(() => {
        // 마이페이지로 이동하면서 새로고침 파라미터 추가
        router.push('/front/my-page?refresh=true');
      }, 2000);
    } catch (error) {
      console.error('[비밀번호 변경 요청 오류]', error);
      setErrorMsg('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="mypage-changePW-page py-4 px-4 mt-20">
      <h2 className="text-2xl font-semibold mb-10 text-center">
        마이페이지 비밀번호 수정
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="relative">
          <Input
            type="password"
            placeholder="현재 비밀번호"
            {...register('currentPassword')}
          />
          <p className="absolute top-[45px] left-0 mt-1 px-2 text-xs text-red-500">
            {errors.currentPassword?.message}
          </p>
        </div>

        <div className="relative">
          <Input
            type="password"
            placeholder="새 비밀번호"
            {...register('newPassword')}
          />
          <p className="absolute top-[45px] left-0 mt-1 px-2 text-xs text-red-500">
            {errors.newPassword?.message}
          </p>
        </div>

        <div className="relative">
          <Input
            type="password"
            placeholder="새 비밀번호 확인"
            {...register('confirmPassword')}
          />
          <p className="absolute top-[45px] left-0 mt-1 px-2 text-xs text-red-500">
            {errors.confirmPassword?.message}
          </p>
        </div>

        <Button type="submit" className="w-full bg-blue-600 text-white">
          확인
        </Button>
      </form>

      {message && (
        <p className="mt-6 text-green-600 text-center font-semibold">
          {message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-6 text-red-500 text-center font-semibold">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
