/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: "loose",
  },
  transpilePackages: ["@mdn/mdn-http-observatory", "http-cookie-agent"],
};
module.exports = nextConfig;
