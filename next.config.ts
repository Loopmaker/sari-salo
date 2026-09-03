import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "osygomukrfqnbpndnmpl.supabase.co",
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/storefront",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
