/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@mdn/mdn-http-observatory"],
  },
};
module.exports = nextConfig;
