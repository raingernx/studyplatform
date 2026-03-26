const nextConfig = {
  transpilePackages: ["geist"],
  turbopack: {},
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
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
