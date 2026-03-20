import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  transpilePackages: ["geist"],
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  turbopack: {
    root: path.join(__dirname),
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
