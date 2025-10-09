import axios, { InternalAxiosRequestConfig } from 'axios';
import { getCookieValue } from '@/utils/cookie';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url || '';

  // 공개 API는 Authorization 헤더 제거 (소셜 로그인 토큰 문제 해결)
  const isPublicSearch =
    url.includes('/api/users/search') || url.includes('/api/friends');

  if (isPublicSearch) {
    // 공개 API는 Authorization 헤더 제거
    console.log('🔓 [공개 API] Authorization 헤더 제거:', url);
    if (config.headers) {
      delete (config.headers as Record<string, unknown>).Authorization;
    }
  } else {
    // 일반 API는 토큰 추가
    const token = getCookieValue('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default instance;
