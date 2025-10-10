import axios, { InternalAxiosRequestConfig } from 'axios';
import { getCookieValue } from '@/utils/cookie';

const getBaseURL = () => {
  // 브라우저 환경(클라이언트)에서는 baseURL 없이 상대 경로 사용
  if (typeof window !== 'undefined') {
    return '';
  }
  // 서버 환경에서는 백엔드 URL 사용
  return process.env.API_BASE_URL || '';
};

const instance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url || '';

  // 공개 API는 Authorization 헤더 제거 (소셜 로그인 JWT 문제 해결)
  const PUBLIC_PATHS = ['/api/users/search'];

  if (PUBLIC_PATHS.some((path) => url.startsWith(path))) {
    // 공개 API는 토큰 제거
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
