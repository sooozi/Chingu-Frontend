'use client';

import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCookieValue, deleteCookie } from '@/utils/cookie';

export default function MypageDeleteAccount() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [isSocialLogin, setIsSocialLogin] = useState(false);

  // 컴포넌트 마운트 시 소셜 로그인 여부 자동 확인
  useEffect(() => {
    const checkSocialLogin = async () => {
      const token = getCookieValue('accessToken');
      if (!token) return;

      try {
        // 1. URL 파라미터에서 소셜 타입 확인
        const urlParams = new URLSearchParams(window.location.search);
        const urlSocialType = urlParams.get('socialType');
        if (urlSocialType) {
          console.log('[회원 탈퇴] URL에서 소셜 타입 발견:', urlSocialType);
          setIsSocialLogin(true);
          return;
        }

        // 2. 쿠키에서 소셜 타입 확인
        const storedLoginType = getCookieValue('loginType');
        if (storedLoginType) {
          console.log('[회원 탈퇴] 쿠키에서 소셜 타입 발견:', storedLoginType);
          setIsSocialLogin(true);
          // 쿠키 유지 (다른 페이지에서도 사용 가능)
          return;
        }

        // 3. JWT 토큰에서 확인
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[회원 탈퇴] JWT payload:', payload);

        // JWT에서 소셜 로그인 정보 확인
        let isSocialFromJWT = false;
        let socialType = '';

        if (payload.socialType) {
          isSocialFromJWT = true;
          socialType = payload.socialType;
        } else if (payload.provider) {
          isSocialFromJWT = true;
          socialType = payload.provider;
        } else if (payload.auth_provider) {
          isSocialFromJWT = true;
          socialType = payload.auth_provider;
        } else if (payload.login_type) {
          isSocialFromJWT = true;
          socialType = payload.login_type;
        }

        if (isSocialFromJWT) {
          setIsSocialLogin(true);
          console.log('[회원 탈퇴] JWT에서 소셜 로그인 감지:', socialType);
          return;
        }

        // 2. JWT에서 감지되지 않으면 API 호출로 확인
        console.log('[회원 탈퇴] JWT에서 감지되지 않음, API 호출로 확인');
        const response = await fetch('/api/users/mypage', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('[회원 탈퇴] 사용자 정보:', userData);

          // API 응답에서 소셜 로그인 여부 확인
          const isSocialFromAPI =
            userData.socialType ||
            userData.provider ||
            userData.auth_provider ||
            userData.login_type ||
            userData.social_type;

          setIsSocialLogin(!!isSocialFromAPI);
          console.log(
            '[회원 탈퇴] API에서 소셜 로그인 여부:',
            !!isSocialFromAPI
          );
        }
      } catch (error) {
        console.error('[회원 탈퇴] 소셜 로그인 확인 오류:', error);
        // API 호출 실패 시에도 쿠키에서 재확인
        const fallbackLoginType = getCookieValue('loginType');
        if (fallbackLoginType) {
          console.log(
            '[회원 탈퇴] API 실패 후 쿠키에서 소셜 타입 재확인:',
            fallbackLoginType
          );
          setIsSocialLogin(true);
          // 쿠키 유지 (다른 페이지에서도 사용 가능)
        } else {
          // 오류 시 기본값으로 일반 로그인으로 설정
          setIsSocialLogin(false);
        }
      }
    };

    checkSocialLogin();
  }, []);

  const handleDeleteAccount = async () => {
    const token = getCookieValue('accessToken');
    console.log('[회원 탈퇴] 토큰 확인:', token ? '존재' : '없음');
    console.log('[회원 탈퇴] 소셜 로그인 여부:', isSocialLogin);

    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/front/account/login');
      return;
    }

    // 토큰 유효성 간단 체크
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[회원 탈퇴] 토큰 payload:', payload);
      console.log('[회원 탈퇴] 토큰 만료 시간:', new Date(payload.exp * 1000));
      console.log('[회원 탈퇴] 현재 시간:', new Date());

      if (payload.exp * 1000 < Date.now()) {
        console.log('[회원 탈퇴] 토큰 만료됨');
        setErrorMsg('세션이 만료되었습니다. 다시 로그인해주세요.');
        setTimeout(() => {
          router.push('/front/account/login');
        }, 2000);
        return;
      }
    } catch (error) {
      console.error('[회원 탈퇴] 토큰 파싱 오류:', error);
      setErrorMsg('유효하지 않은 토큰입니다. 다시 로그인해주세요.');
      setTimeout(() => {
        router.push('/front/account/login');
      }, 2000);
      return;
    }

    // 소셜 로그인 여부에 따른 처리
    if (!isSocialLogin) {
      // 일반 로그인 사용자: 비밀번호 확인
      if (!password.trim()) {
        setErrorMsg('비밀번호를 입력해주세요.');
        return;
      }

      // 일반 로그인 사용자 확인 알럿창
      const confirmed = window.confirm(
        '정말로 회원 탈퇴를 진행하시겠습니까?\n\n입력하신 비밀번호로 본인 확인 후 탈퇴가 진행됩니다.\n탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.'
      );

      if (!confirmed) {
        return;
      }
    } else {
      // 소셜 로그인 사용자 확인 알럿창
      const confirmed = window.confirm(
        '정말로 회원 탈퇴를 진행하시겠습니까?\n\n소셜 로그인 사용자이므로 비밀번호 확인 없이 탈퇴가 진행됩니다.\n탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.'
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setIsDeleting(true);
      setMessage('');
      setErrorMsg('');

      console.log('[회원 탈퇴] API 요청 시작 - 소셜 로그인:', isSocialLogin);
      const res = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // 일반 로그인: 비밀번호 포함, 소셜 로그인: 빈 객체
        body: JSON.stringify(isSocialLogin ? {} : { password }),
      });

      console.log('[회원 탈퇴] API 응답 상태:', res.status);
      const result = await res.json();
      console.log('[회원 탈퇴] API 응답 데이터:', result);

      if (!res.ok) {
        console.error('[회원 탈퇴 실패]', result);

        // 401 Unauthorized 처리
        if (res.status === 401) {
          setErrorMsg('세션이 만료되었습니다. 다시 로그인해주세요.');
          // 모든 쿠키 삭제
          deleteCookie('accessToken');
          deleteCookie('loginType');
          setTimeout(() => {
            router.push('/front/account/login');
          }, 1500);
          return;
        }

        setErrorMsg(result.message || '회원 탈퇴 실패');
        return;
      }

      setMessage('회원 탈퇴가 완료되었습니다.');

      // 회원 탈퇴 성공 시 모든 쿠키 삭제
      deleteCookie('accessToken');
      deleteCookie('loginType');

      setTimeout(() => router.push('/front/account/login'), 2000);
    } catch (error) {
      console.error('[회원 탈퇴 요청 오류]', error);
      setErrorMsg('서버 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mypage-delete-page py-4 px-4 mt-20">
      <h2 className="text-2xl font-semibold mb-10 text-center">회원 탈퇴</h2>

      <div className="space-y-6">
        {/* 경고 메시지 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                회원 탈퇴 주의사항
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>탈퇴 후에는 모든 개인정보가 삭제됩니다.</li>
                  <li>작성한 게시글, 댓글 등 모든 데이터가 삭제됩니다.</li>
                  <li>탈퇴 후에는 데이터 복구가 불가능합니다.</li>
                  <li>동일한 이메일로 재가입이 제한될 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 자동으로 감지된 로그인 타입에 따른 UI */}
        {!isSocialLogin && (
          <div className="mb-4">
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
            {errorMsg && !isDeleting && (
              <p className="mt-2 text-sm text-red-500">{errorMsg}</p>
            )}
          </div>
        )}

        {/* 소셜 로그인 사용자 안내 */}
        {isSocialLogin && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              소셜 로그인 사용자는 비밀번호 입력 없이 확인만으로 탈퇴할 수
              있습니다.
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
        >
          {isDeleting ? '탈퇴 처리 중...' : '회원 탈퇴하기'}
        </Button>
      </div>

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
