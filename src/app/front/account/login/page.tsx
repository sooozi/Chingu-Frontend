'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios, { isAxiosError } from 'axios';
import { getCookieValue } from '@/utils/cookie';

// Zod 스키마 정의
const LoginSchema = z.object({
  id: z.string().min(5, '아이디는 필수입니다'),
  password: z
    .string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다')
    .max(20, '비밀번호는 최대 20자까지 입력 가능합니다'),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  });

  // 로그인 처리 로직
  const router = useRouter();
  const [loginError, setLoginError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [hideAlert, setHideAlert] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 로그인 상태 체크 및 토큰 콘솔 출력
  useEffect(() => {
    const token = getCookieValue('accessToken');
    if (token && !hasAlerted.current) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[쿠키 토큰 payload]', payload);
        alert('이미 로그인된 상태입니다.');
        hasAlerted.current = true;
        router.replace('/front/my-home');
      } catch (err) {
        console.error('[토큰 파싱 오류]', err);
      }
    }
  }, [router]);

  // OAuth 오류 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      let errorMessage = '로그인 중 오류가 발생했습니다.';

      switch (error) {
        case 'oauth_error':
          errorMessage = '소셜 로그인 중 오류가 발생했습니다.';
          break;
        case 'no_code':
          errorMessage = '인증 코드를 받지 못했습니다.';
          break;
        case 'token_exchange_failed':
          errorMessage = '토큰 교환에 실패했습니다.';
          break;
        case 'callback_error':
          errorMessage = '로그인 콜백 처리 중 오류가 발생했습니다.';
          break;
      }

      setLoginError(errorMessage);

      // URL에서 오류 파라미터 제거
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  useEffect(() => {
    if (loginError) {
      setShowAlert(true);
      setHideAlert(false);

      const hideTimer = setTimeout(() => {
        setHideAlert(true); // opacity 줄이기 시작
      }, 1000); // 1초 뒤에 사라지게 전환

      const removeTimer = setTimeout(() => {
        setShowAlert(false); // DOM 제거
      }, 1500); // fade-out 완료 후 제거

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [loginError]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);

    const payload = {
      userId: data.id,
      password: data.password,
    };

    try {
      const response = await axios.post('/api/auth/login', payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const { accessToken } = response.data;

      // 쿠키로 저장 (secure, SameSite는 필요 시 조정)
      document.cookie = `accessToken=${accessToken}; path=/; secure; SameSite=Lax`;

      router.push('/front/my-home');
    } catch (error: unknown) {
      console.error('[로그인 실패]', error);

      if (isAxiosError(error)) {
        const message = error.response?.data?.message;
        console.error('[서버 응답 메시지]', message);

        if (message === 'Bad credentials') {
          setShowAlert(false);
          setLoginError('');
          setTimeout(() => {
            setLoginError('아이디 또는 비밀번호를 확인해주세요.');
          }, 10);
        } else {
          setLoginError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        setLoginError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 카카오 로그인 처리
  const handleKakaoLogin = () => {
    // 소셜 로그인 타입을 쿠키에 저장
    document.cookie = 'loginType=kakao; path=/; max-age=300; SameSite=Lax';
    console.log('[카카오 로그인] 쿠키 설정 완료: loginType=kakao');

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'https://chinguchingu.kro.kr';
    // URL 끝에 슬래시가 있는지 확인하고 제거
    const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    const kakaoLoginUrl = `${cleanApiBaseUrl}/oauth2/authorization/kakao`;

    console.log('[카카오 로그인] 리다이렉트 URL:', kakaoLoginUrl);
    window.location.href = kakaoLoginUrl;
  };

  // 구글 로그인 처리
  const handleGoogleLogin = () => {
    // 소셜 로그인 타입을 쿠키에 저장
    document.cookie = 'loginType=google; path=/; max-age=300; SameSite=Lax';

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'https://chinguchingu.kro.kr';
    // URL 끝에 슬래시가 있는지 확인하고 제거
    const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    const googleLoginUrl = `${cleanApiBaseUrl}/oauth2/authorization/google`;
    window.location.href = googleLoginUrl;
  };

  // 로그인 후 진입
  const hasAlerted = useRef(false);

  return (
    <div
      className="login-page relative h-full flex flex-col items-center justify-center overflow-hidden tracking-tight py-4 px-4"
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
        <div className="text-center space-y-4 mb-8 animate-slideUp opacity-0">
          <h3 className="text-lg font-medium text-gray-700">
            친구와 더 가까워지는 시간
          </h3>
          <h2 className="text-5xl text-black drop-shadow-sm font-bold">
            로그인
          </h2>
          <p className="text-gray-600 leading-relaxed">
            칭구칭구에 오신 것을 환영합니다!
          </p>
        </div>

        {/* 알럿 메시지 */}
        {showAlert && (
          <div className={`cont-alert ${hideAlert ? 'hide' : ''}`}>
            {loginError}
          </div>
        )}

        {/* 로그인 폼 */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="animate-slideUp delay-300 opacity-0"
        >
          {/* 아이디 입력 */}
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="아이디를 입력하세요"
              {...register('id')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
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
            <p
              className={`absolute top-[45px] left-0 mt-1 text-xs text-red-500 transition-opacity duration-200 ${
                errors.id ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {errors.id?.message ?? ''}
            </p>
          </div>

          {/* 비밀번호 입력 */}
          <div className="relative mb-6">
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              {...register('password')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
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
            <p
              className={`absolute top-[45px] left-0 mt-1 text-xs text-red-500 transition-opacity duration-200 ${
                errors.password ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {errors.password?.message ?? ''}
            </p>
          </div>

          {/* 링크 */}
          <div className="flex items-center justify-end mt-2 animate-slideUp delay-600 opacity-0">
            <Link
              href="/front/account/find-id"
              className="text-sm max-w-fit px-2 text-center border-r border-gray-400 text-gray-600 hover:text-main-color transition-colors duration-200"
            >
              아이디 찾기
            </Link>
            <Link
              href="/front/account/find-pw"
              className="text-sm max-w-fit px-2 text-center text-gray-600 hover:text-main-color transition-colors duration-200"
            >
              비밀번호 찾기
            </Link>
          </div>

          {/* 로그인 버튼 / 회원가입 */}
          <div className="flex items-center justify-center gap-3 mt-8 animate-slideUp delay-1000 opacity-0">
            <Link
              href="signup"
              className="flex-1 bg-main-color text-white px-4 py-3 rounded-xl text-center font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              회원가입
            </Link>
            <Button
              type="submit"
              className="flex-1 w-full bg-main-color text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </form>

        {/* 소셜 로그인 */}
        <div className="social-login-wrap mt-12 animate-slideUp delay-1200 opacity-0">
          <div
            onClick={handleGoogleLogin}
            className="border border-gray-300 text-sm px-4 py-3 rounded-xl w-full text-center bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer mb-3 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 font-medium">Google로 로그인</span>
          </div>
          <div
            onClick={handleKakaoLogin}
            className="border border-gray-300 text-sm px-4 py-3 rounded-xl w-full text-center bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <Image
              src="/images/kakao-logo.png"
              alt="카카오"
              width={20}
              height={20}
            />
            <span className="text-gray-700 font-medium">카카오로 로그인</span>
          </div>
        </div>
      </div>
    </div>
  );
}
