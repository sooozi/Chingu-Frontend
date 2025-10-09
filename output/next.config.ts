/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chingu-album.s3.ap-northeast-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL;

    if (!apiBaseUrl) {
      console.warn('⚠️ API_BASE_URL is not defined');
      return [];
    }

    return [
      {
        source: '/api/users/:path*',
        destination: `${apiBaseUrl}/api/users/:path*`,
      },
    ];
  },
};

export default nextConfig;
