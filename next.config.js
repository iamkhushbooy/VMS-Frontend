/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/vms",
  assetPrefix: "/vms",

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  allowedDevOrigins: [
    'prayog.vaaman.in',
    'https://prayog.vaaman.in',
    'http://prayog.vaaman.in'
  ],
};

module.exports = nextConfig;