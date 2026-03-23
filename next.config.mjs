const nextConfig = {
  transpilePackages: ["geist"],
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  webpack(config) {
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      async_hooks: false,
      fs: false,
      path: false,
    };

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
