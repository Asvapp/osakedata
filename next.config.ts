import NextPWA from 'next-pwa'

const withPWA = NextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [
    /app-build-manifest\.json$/,
    /middleware-manifest\.json$/,
  ],
  runtimeCaching: [
    {
      urlPattern: /_next\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-assets'
      }
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache'
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    return [
      {
        source: '/manifest.json',
        destination: '/api/manifest',
      },
    ];
  },
}

export default withPWA(nextConfig)