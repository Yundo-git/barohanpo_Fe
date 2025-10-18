/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode for better compatibility
  reactStrictMode: false,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/**",
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    // SVG 허용
    dangerouslyAllowSVG: true,
    // 콘텐츠 보안 정책 (필요한 경우에만 사용)
    // contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Next.js 15.3.5+에서는 experimental 설정이 필요 없음

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Fix for WebpackError constructor issue
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Disable minification in development
    if (dev) {
      config.optimization = {
        ...config.optimization,
        minimize: false,
        minimizer: [],
      };
    }

    return config;
  },

  // Disable TypeScript type checking during build to speed up the process
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // CORS headers for development
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
