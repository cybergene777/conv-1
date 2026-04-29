/** @type {import('next').NextConfig} */
const nextConfig = {
  // 关闭严格模式避免开发环境双重渲染
  reactStrictMode: false,
  // 流式响应需要关闭静态优化
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

module.exports = nextConfig;
