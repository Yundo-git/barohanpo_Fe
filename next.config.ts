import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: "export",

  // Experimental features configuration
  experimental: {
    // Add any valid experimental features here
  },

  // Remove eslint config as it's no longer supported in next.config.ts
  // Move to eslint.config.js or .eslintrc.js

  // Allow specific development origins
  allowedDevOrigins: [
    "http://10.0.2.2:3000", // Android emulator
    "http://192.168.0.21:3000", // iOS emulator
    "http://192.168.75.49:3000",
    "https://barohanpo-fe.vercel.app",
  ],

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
    dangerouslyAllowSVG: true,
  },

  // Webpack configuration with fallbacks
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

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // CORS headers for development
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "development"
                ? "http://localhost:3000"
                : "https://barohanpo-fe.vercel.app",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

// Use webpack for now to avoid Turbopack issues
export default {
  ...nextConfig,
  experimental: {
    ...nextConfig.experimental,
    // Disable Turbopack for now
    turbo: undefined,
  },
  // Explicitly set webpack as the bundler
  webpack: nextConfig.webpack,
};
