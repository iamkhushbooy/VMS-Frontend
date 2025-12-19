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
}

export default nextConfig;
