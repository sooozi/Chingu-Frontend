'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/api/admin/check');

        // 응답이 성공적으로 오면 관리자 권한이 있다고 판단
        if (response.status === 200) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error: unknown) {
        // 401, 403 에러는 권한 없음
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'status' in error.response
        ) {
          const status = (error.response as { status: number }).status;

          if (status === 401 || status === 403) {
            setIsAdmin(false);
          } else {
            // 기타 에러는 권한 확인 불가
            setIsAdmin(false);
          }
        } else {
          // 에러 객체 구조를 파악할 수 없는 경우
          setIsAdmin(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminPermission();
  }, []);

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 관리자가 아닐 때
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            접근 권한이 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
          <button
            onClick={() => router.push('/front/my-home')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 관리자일 때 자식 컴포넌트 렌더링
  return <>{children}</>;
}
