import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/management/cameras',
        destination: '/management?tab=cameras',
        permanent: true,
      },
      {
        source: '/management/stands',
        destination: '/management?tab=stands',
        permanent: true,
      },
      {
        source: '/management/hunts',
        destination: '/management?tab=hunts',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
