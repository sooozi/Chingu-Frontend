'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CheckableInput from '@/components/common/CheckableInput';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import SocialLoginBadge from '@/components/common/SocialLoginBadge';
import { getCookieValue } from '@/utils/cookie';

const MypageSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상 입력해주세요.'),
  name: z.string(),
  userId: z.string(),
  email: z.string().email('유효한 이메일 형식이 아닙니다.'),
  isNicknameChecked: z.literal(true).refine((val) => val === true, {
    message: '닉네임 중복 확인을 해주세요',
  }),
});

type MypageFormValues = z.infer<typeof MypageSchema>;

export default function Mypage() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canUploadToday, setCanUploadToday] = useState(true);
  const [lastUploadDate, setLastUploadDate] = useState<string | null>(null);
  const [jwtNickname, setJwtNickname] = useState<string>('');
  const [socialType, setSocialType] = useState<string>('');

  const { register, reset, getValues, setValue } = useForm<MypageFormValues>({
    resolver: zodResolver(MypageSchema),
    defaultValues: {
      nickname: '',
      name: '',
      userId: '',
      email: '',
      isNicknameChecked: true,
    },
  });

  // JWT 토큰에서 닉네임 추출 함수
  function decodeJwtPayload(token: string): {
    nickname?: string;
    sub?: string;
    socialType?: string;
    [key: string]: unknown;
  } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('[토큰 파싱 오류]', e);
      return null;
    }
  }

  // JWT 토큰에서 닉네임 추출
  useEffect(() => {
    const token = getCookieValue('accessToken');
    if (!token) return;

    const payload = decodeJwtPayload(token);

    if (payload?.nickname) {
      setJwtNickname(payload.nickname);
      // 즉시 폼에 설정
      setValue('nickname', payload.nickname);
    } else if (payload?.sub) {
      setJwtNickname(payload.sub);
      // 즉시 폼에 설정
      setValue('nickname', payload.sub);
    }

    // 1. URL 파라미터에서 소셜 타입 확인
    const urlParams = new URLSearchParams(window.location.search);
    const urlSocialType = urlParams.get('socialType');
    console.log('[마이페이지] URL 파라미터 확인:', urlSocialType);
    if (urlSocialType) {
      console.log('[마이페이지] URL에서 소셜 타입 발견:', urlSocialType);
      setSocialType(urlSocialType);
      // URL 파라미터 제거
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return;
    }

    // 2. 쿠키에서 소셜 타입 확인
    console.log('[마이페이지] 모든 쿠키:', document.cookie);
    const storedLoginType = getCookieValue('loginType');
    console.log('[마이페이지] loginType 쿠키 값:', storedLoginType);
    if (storedLoginType) {
      console.log('[마이페이지] 쿠키에서 소셜 타입 발견:', storedLoginType);
      setSocialType(storedLoginType);
      // 쿠키 유지 (다른 페이지에서도 사용 가능)
      return;
    }

    // 3. JWT에서 소셜 타입 확인 (기존 로직)
    if (payload?.socialType) {
      console.log('[마이페이지] JWT에서 socialType 발견:', payload.socialType);
      setSocialType(payload.socialType);
    } else {
      console.log('[마이페이지] JWT에서 socialType 없음, 다른 필드 확인 중...');
      // 다른 가능한 필드명들 확인
      const possibleSocialFields = [
        'social_type',
        'provider',
        'auth_provider',
        'login_type',
        'iss', // JWT issuer
        'aud', // JWT audience
        'sub', // JWT subject
        'name',
        'given_name',
        'family_name',
      ];

      let socialTypeFound = false;
      for (const field of possibleSocialFields) {
        if (payload?.[field] && typeof payload[field] === 'string') {
          const value = payload[field] as string;
          console.log(`[마이페이지] 필드 ${field} 값:`, value);

          // 카카오 관련 키워드 확인
          if (
            value.toLowerCase().includes('kakao') ||
            value.toLowerCase().includes('kakao.com') ||
            value.toLowerCase().includes('kakaoaccount')
          ) {
            console.log('[마이페이지] 카카오 로그인 감지됨');
            setSocialType('kakao');
            socialTypeFound = true;
            break;
          }
          // 구글 관련 키워드 확인
          if (value.toLowerCase().includes('google')) {
            console.log('[마이페이지] 구글 로그인 감지됨');
            setSocialType('google');
            socialTypeFound = true;
            break;
          }
        }
      }

      if (!socialTypeFound) {
        console.log('[마이페이지] JWT에서 소셜 로그인 정보를 찾을 수 없음');
      }
    }

    // 최종 socialType 상태 콘솔 출력
    console.log('[마이페이지] 최종 socialType:', socialType || 'undefined');
  }, [setValue, socialType]);

  useEffect(() => {
    const token = getCookieValue('accessToken');

    if (!token) return;

    // refresh 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const shouldRefresh = urlParams.get('refresh');
    if (shouldRefresh) {
      console.log(
        '[마이페이지] 새로고침 파라미터 감지, 사용자 정보 강제 새로고침'
      );
      // URL에서 refresh 파라미터 제거
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    const checkUploadLimit = () => {
      // SSR 환경에서 localStorage 접근 안전성 확인
      if (typeof window === 'undefined') return;

      // 하루 1개 업로드 제한 체크
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD (UTC)
      const storedDate = localStorage.getItem('lastProfileUploadDate');

      if (storedDate === today) {
        setCanUploadToday(false);
        setLastUploadDate(storedDate);
      } else {
        setCanUploadToday(true);
        setLastUploadDate(storedDate);
      }
    };

    checkUploadLimit();

    // 자정까지 남은 시간 계산하여 한 번만 체크
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0
      )
    );

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // 자정에 한 번만 체크 (최대 24시간으로 제한)
    const timeoutId = setTimeout(
      checkUploadLimit,
      Math.min(timeUntilMidnight, 24 * 60 * 60 * 1000)
    );

    // JWT 토큰에서 닉네임 추출 (소셜 로그인 사용자용)
    const payload = decodeJwtPayload(token);
    let tokenNickname = '';
    if (payload?.nickname) {
      tokenNickname = payload.nickname;
    } else if (payload?.sub) {
      tokenNickname = payload.sub;
    } else {
      tokenNickname = '';
    }

    fetch('/api/users/mypage', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
          router.push('/front/account/login');
          return;
        }
        if (!res.ok) {
          console.error('[유저 정보 불러오기 오류] 응답 상태:', res.status);
          throw new Error('유저 정보 조회 실패');
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        // API 응답에서 socialType 확인
        if (data.socialType) {
          console.log('[마이페이지] API에서 socialType 발견:', data.socialType);
          setSocialType(data.socialType);
        } else if (data.provider) {
          console.log('[마이페이지] API에서 provider 발견:', data.provider);
          setSocialType(data.provider);
        } else if (data.social_type) {
          console.log(
            '[마이페이지] API에서 social_type 발견:',
            data.social_type
          );
          setSocialType(data.social_type);
        }

        // API 응답의 닉네임을 우선 사용, default-nickname이면 JWT sub 사용
        let finalNickname = data.nickname || tokenNickname || jwtNickname || '';

        // default-nickname이면 JWT의 sub 필드 사용
        if (finalNickname === 'default-nickname' && payload?.sub) {
          finalNickname = payload.sub;
          console.log(
            '[마이페이지] default-nickname 감지, JWT sub 사용:',
            payload.sub
          );
        }

        reset({
          nickname: finalNickname,
          name: data.name || '',
          userId: data.userId || '',
          email: data.email || '',
        });

        if (data.profilePictureUrl) setImagePreview(data.profilePictureUrl);
      })
      .catch((err) => {
        console.error('[유저 정보 불러오기 오류]', err);
        // API 호출 실패 시 JWT에서 닉네임 사용
        let finalNickname = tokenNickname || jwtNickname || '';

        // default-nickname이면 JWT의 sub 필드 사용
        if (finalNickname === 'default-nickname' && payload?.sub) {
          finalNickname = payload.sub;
        }

        if (finalNickname) {
          reset({
            nickname: finalNickname,
            name: '',
            userId: '',
            email: '',
          });
        }

        // 쿠키에서 소셜 타입 재확인
        const storedLoginType = getCookieValue('loginType');
        if (storedLoginType) {
          setSocialType(storedLoginType);
          // deleteCookie('loginType');
        }
      });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router, reset, jwtNickname, socialType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 하루 1개 업로드 제한 체크
    if (!canUploadToday) {
      alert(
        '하루에 1개의 프로필 이미지만 업로드할 수 있습니다. 내일 다시 시도해주세요.'
      );
      e.target.value = ''; // 파일 선택 취소
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        e.target.value = '';
        return;
      }

      // 파일 타입 제한
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('JPG, PNG 파일만 업로드 가능합니다.');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        console.error('파일 읽기 실패:', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordEdit = () => {
    const getCookieValue = (name: string) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const token = getCookieValue('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/front/account/login');
      return;
    }

    // 소셜 로그인 사용자인지 확인
    if (
      socialType &&
      socialType !== 'undefined' &&
      socialType !== 'NONE' &&
      socialType !== ''
    ) {
      alert(
        '소셜 로그인 사용자는 비밀번호를 설정할 수 없습니다.\n소셜 로그인 계정의 비밀번호는 해당 소셜 플랫폼에서 관리됩니다.'
      );
      return;
    }

    router.push('/front/my-page/change-pw');
  };

  const handleWithdraw = () => {
    const getCookieValue = (name: string) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const token = getCookieValue('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/front/account/login');
      return;
    } else {
      router.push('/front/account/del-account');
    }
  };

  const handleBlockedClick = (e: React.MouseEvent) => {
    if (!isEditable) {
      e.preventDefault();
      e.stopPropagation();
      alert('수정을 원하시면 "마이페이지 수정" 버튼을 눌러주세요.');
    }
  };

  const handleSubmitEdit = async () => {
    // 중복 실행 방지
    if (isSubmitting) return;
    setIsSubmitting(true);

    const getCookieValue = (name: string) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const token = getCookieValue('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      setIsSubmitting(false);
      router.push('/front/account/login');
      return;
    }

    const values = getValues();
    let uploadedImageUrl = imagePreview;

    try {
      setIsSubmitting(true);

      // 새로 업로드한 이미지 파일이 있다면
      const fileInput =
        document.querySelector<HTMLInputElement>('input[type="file"]');
      const file = fileInput?.files?.[0];

      if (file) {
        // 하루 1개 업로드 제한 재확인
        if (!canUploadToday) {
          alert(
            '하루에 1개의 프로필 이미지만 업로드할 수 있습니다. 내일 다시 시도해주세요.'
          );
          return;
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';

        try {
          // presigned URL 요청 (단일 시도만)
          const presignRes = await fetch(
            `/api/users/upload-url/profile?extension=${ext}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (presignRes.ok) {
            const { uploadUrl, fileUrl } = await presignRes.json();

            // S3로 이미지 업로드 (타임아웃 설정)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

            try {
              const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': file.type,
                },
                body: file,
                signal: controller.signal,
              });

              if (uploadResponse.ok) {
                uploadedImageUrl = fileUrl;
                setImagePreview(fileUrl);
              } else {
                alert(
                  '프로필 이미지 업로드에 실패했습니다. 내일 다시 시도해주세요.'
                );
                return;
              }
            } finally {
              clearTimeout(timeoutId);
            }
          } else {
            alert(
              '프로필 이미지 업로드에 실패했습니다. 내일 다시 시도해주세요.'
            );
            return;
          }
        } catch {
          alert('프로필 이미지 업로드에 실패했습니다. 내일 다시 시도해주세요.');
          return;
        }
      }

      // 최종 수정 요청
      const payload = {
        nickname: values.nickname,
        email: values.email,
        profilePictureUrl: uploadedImageUrl || '',
      };

      const res = await fetch('/api/users/mypage/edit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('[수정 실패]', data);
        alert('수정에 실패했습니다.');
        return;
      }

      // 최종 성공 시에만 localStorage 업데이트
      if (uploadedImageUrl) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        localStorage.setItem('lastProfileUploadDate', today);
        setCanUploadToday(false);
        setLastUploadDate(today);
      }

      alert('정보가 성공적으로 수정되었습니다.');
      setIsEditable(false);
    } catch (err) {
      console.error('[정보 수정 오류]', err);
      alert('정보 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mypage-page py-24 px-4 mx-auto rounded-lg bg-gray-100">
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
        <h2 className="text-2xl font-semibold text-center flex-1">
          마이페이지
        </h2>
      </div>

      <div
        className="mb-4 p-4 pr-1 bg-white rounded-lg shadow-sm gap-2 max-h-[410px] overflow-y-auto scroll-overlay"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">내 정보</h3>
            <SocialLoginBadge socialType={socialType} />
          </div>
          <Button
            type="button"
            onClick={() => setIsEditable(true)}
            className="!text-xs !p-2 !bg-[#aa96fc] text-white"
          >
            마이페이지 수정
          </Button>
        </div>

        <div onClick={handleBlockedClick}>
          {/* 닉네임 - 중복 확인 api */}
          <div className={isEditable ? '' : 'pointer-events-none'}>
            <CheckableInput<MypageFormValues>
              name="nickname"
              placeholder="닉네임"
              checkUrl="/api/users/check-nickname"
              queryKey="nickname"
              successMessage="사용 가능한 닉네임입니다."
              failureMessage="이미 사용 중인 닉네임입니다."
              register={register}
              getValues={getValues}
              setValue={setValue}
              flagField="isNicknameChecked"
            />
          </div>

          {/* 이름 */}
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="이름"
              {...register('name')}
              readOnly={!isEditable}
              className="bg-[#f3f3f5] border-gray-300"
              onClick={(e) => {
                if (!isEditable) {
                  e.stopPropagation();
                  alert('수정을 원하시면 "마이페이지 수정" 버튼을 눌러주세요.');
                }
              }}
            />
          </div>

          {/* 아이디 */}
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="아이디"
              {...register('userId')}
              readOnly={!isEditable}
              className="bg-[#f3f3f5] border-gray-300"
              onClick={(e) => {
                if (!isEditable) {
                  e.stopPropagation();
                  alert('수정을 원하시면 "마이페이지 수정" 버튼을 눌러주세요.');
                }
              }}
            />
          </div>

          {/* 이메일 */}
          <div className="relative mb-6">
            <Input
              type="email"
              placeholder="이메일"
              {...register('email')}
              readOnly={!isEditable}
              className="bg-[#f3f3f5] border-gray-300"
              onClick={(e) => {
                if (!isEditable) {
                  e.stopPropagation();
                  alert('수정을 원하시면 "마이페이지 수정" 버튼을 눌러주세요.');
                }
              }}
            />
          </div>

          {/* 프로필 이미지 */}
          <div className="mb-4">
            <label className="block font-medium text-sm mb-1">
              프로필 이미지
            </label>

            <div className="flex flex-col items-center gap-4">
              {/* 프로필 이미지 미리보기 */}
              {imagePreview ? (
                <div className="w-full max-w-md">
                  <div className="flex justify-center">
                    <div className="relative w-32 h-32">
                      <Image
                        src={imagePreview}
                        alt="프로필 이미지"
                        width={128}
                        height={128}
                        className="w-full h-full rounded-lg object-cover border border-gray-200"
                      />
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => setImagePreview(null)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-600 text-sm font-medium">
                      📷 프로필 이미지가 없습니다
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      프로필을 더 멋지게 만들어보세요!
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      JPG, PNG 파일만 가능 (최대 5MB)
                    </p>
                  </div>
                </div>
              )}

              {/* 파일 선택 버튼 */}
              {isEditable && (
                <div className="w-full max-w-md">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="profile-upload"
                    disabled={!canUploadToday}
                  />
                  <label
                    htmlFor="profile-upload"
                    className={`w-full py-2 px-4 rounded-lg text-center block transition-colors ${
                      canUploadToday
                        ? 'bg-[#9477ff] hover:bg-[#6845f5] text-white cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {!canUploadToday
                      ? `오늘 업로드 완료 (${lastUploadDate})`
                      : imagePreview
                        ? '이미지 변경'
                        : '이미지 선택'}
                  </label>
                  {!canUploadToday && (
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      하루에 1개의 프로필 이미지만 업로드할 수 있습니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 수정 완료 버튼 */}
          {isEditable && (
            <Button
              type="button"
              onClick={handleSubmitEdit}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '수정 중...' : '수정 완료'}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm gap-2">
        {/* 비밀번호 수정 버튼 */}
        <Button
          type="button"
          onClick={handlePasswordEdit}
          className="w-full mb-4"
        >
          비밀번호 수정
        </Button>

        {/* 회원 탈퇴 버튼 */}
        <Button
          type="button"
          onClick={handleWithdraw}
          className="w-full text-white"
          style={{
            backgroundColor: '#F55',
            borderColor: '#F55',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e44';
            e.currentTarget.style.borderColor = '#e44';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F55';
            e.currentTarget.style.borderColor = '#F55';
          }}
        >
          회원 탈퇴
        </Button>
      </div>
    </div>
  );
}
