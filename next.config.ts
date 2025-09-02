
// import type {NextConfig} from 'next';

// const nextConfig: NextConfig = {
//   /* config options here */
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'placehold.co',
//         port: '',
//         pathname: '/**',
//       },
//        {
//         protocol: 'https',
//         hostname: 'upload.wikimedia.org',
//       }
//     ],
//   },
//   experimental: {
//     serverComponentsExternalPackages: ['jspdf', 'jspdf-autotable', 'html2canvas'],
//   },
// };

// export default nextConfig;







import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: !isProd, // Enable React Strict Mode only in development
  swcMinify: isProd, // Enable SWC minification in production for faster builds

  typescript: {
    ignoreBuildErrors: !isProd, // Ignore TypeScript errors in development only
  },

  eslint: {
    ignoreDuringBuilds: !isProd, // Ignore linting errors during production builds
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ['jspdf', 'jspdf-autotable', 'html2canvas'],
  },
};

export default nextConfig;

