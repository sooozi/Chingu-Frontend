'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminGuard from '../components/AdminGuard';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';

interface StatsData {
  totalUsers: number;
  totalGroups: number;
  activeUsers: number;
}

export default function AdminMain() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalGroups: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // 전체 회원 수 가져오기
        const usersResponse = await axiosInstance.get('/api/admin/users');
        const totalUsers = usersResponse.data?.length || 0;

        // 전체 그룹 수 가져오기
        const groupsResponse = await axiosInstance.get('/api/admin/groups');
        const totalGroups = groupsResponse.data?.length || 0;

        // 활성 사용자 수 (최근 30일 로그인한 사용자로 가정)
        const activeUsers = totalUsers; // 임시로 전체 사용자 수로 설정

        setStats({
          totalUsers,
          totalGroups,
          activeUsers,
        });
      } catch (error) {
        console.error('통계 데이터 가져오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminGuard>
      <div className="admin-page py-4 px-4 pt-10 pb-10 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
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
            관리자 페이지
          </h2>
        </div>

        {/* 통계 섹션 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">시스템 현황</h3>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <span className="text-lg">👥</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">전체 회원</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    <p className="text-xl font-bold text-gray-900">
                      {stats.totalUsers.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg mr-3">
                  <span className="text-lg">🏢</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">전체 그룹</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    <p className="text-xl font-bold text-gray-900">
                      {stats.totalGroups.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg mr-3">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">활성 사용자</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    <p className="text-xl font-bold text-gray-900">
                      {stats.activeUsers.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 섹션 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">빠른 액션</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/admin/member">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg mr-3">
                    <span className="text-lg">👥</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">회원 관리</h4>
                    <p className="text-sm text-gray-600">
                      회원 목록 조회 및 관리
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/admin/group">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-green-50 rounded-lg mr-3">
                    <span className="text-lg">🏢</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">그룹 관리</h4>
                    <p className="text-sm text-gray-600">
                      그룹 및 멤버 정보 관리
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
