'use client';

import React from 'react';

interface SocialLoginBadgeProps {
  socialType?: string;
  className?: string;
}

export default function SocialLoginBadge({
  socialType,
  className = '',
}: SocialLoginBadgeProps) {
  // 유효한 소셜 타입이 아니면 뱃지 표시하지 않음
  if (
    !socialType ||
    socialType === 'undefined' ||
    socialType === 'NONE' ||
    socialType === ''
  )
    return null;

  const getSocialInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case 'google':
      case 'oauth':
        return {
          name: 'Google',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          ),
          bgColor: 'bg-white',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
        };
      case 'kakao':
      case 'kakao_login':
        return {
          name: 'Kakao',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <rect x="1" y="1" width="25" height="25" rx="4" fill="#FEE500" />
              <path
                d="M12 4c-4.5 0-8 3-8 6.5 0 2 1 3.8 2.5 4.8-.1.8-.5 2.2-1.8 3.4 0 0 2.6-.3 4.4-1.6.8.2 1.7.3 2.7.3 4.5 0 8-3 8-6.5s-3.5-6.5-8-6.5z"
                fill="#000"
              />
            </svg>
          ),
          bgColor: 'bg-white',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
        };
      default:
        return {
          name: 'Social',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ),
          bgColor: 'bg-white',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
        };
    }
  };

  const socialInfo = getSocialInfo(socialType);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-normal border ${socialInfo.bgColor} ${socialInfo.textColor} ${socialInfo.borderColor} ${className}`}
    >
      {socialInfo.icon}
    </div>
  );
}
