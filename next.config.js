/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // ✅ 正确：serverExternalPackages 已经移出 experimental，放在这里
  serverExternalPackages: ["@prisma/client"],

  experimental: {
    // 如果没有其他实验性功能，这里可以留空或删除
  },
};

module.exports = nextConfig;