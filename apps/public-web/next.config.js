/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@restorio/types', '@restorio/api-client', '@restorio/auth'],
};

module.exports = nextConfig;

