/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@mdn/mdn-http-observatory", "pg", "pg-native"],
  },
};
module.exports = nextConfig;
