import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Доступ к dev-серверу с телефона по локальной сети
  allowedDevOrigins: ["192.168.0.194", "localhost"],
};

export default nextConfig;
