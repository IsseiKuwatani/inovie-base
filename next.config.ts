import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 本番ビルド時は ESLint チェックをスキップ
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 型チェックエラーがあってもビルドを続行
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
