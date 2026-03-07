/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    webpackBuildWorker: false,
    workerThreads: false,
    cpus: 1,
  },
  images: {
    domains: ['localhost'],
  },
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
  },
}

module.exports = nextConfig
