/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@mdn/mdn-http-observatory",
    "http-cookie-agent",
    "agent-base",
  ],
};
module.exports = nextConfig;
