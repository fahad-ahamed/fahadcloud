import type { NextConfig } from "next";

const nextConfig: NextConfig = { 
  output: "standalone", 
  typescript: { ignoreBuildErrors: true }, 
  reactStrictMode: false,
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('child_process', 'os', 'fs', 'path', 'nodemailer', 'dotenv');
      }
    }
    return config;
  },
};

export default nextConfig;

