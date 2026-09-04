import os from "node:os";
import type { NextConfig } from "next";

const immutable = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

/**
 * Next 16 blocks dev-server requests from any origin other than localhost.
 * Opening the dev server from a phone on the same Wi-Fi therefore needs the
 * machine's LAN addresses allow-listed, otherwise scripts are refused and the
 * page renders but never hydrates.
 */
const lanAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((iface): iface is os.NetworkInterfaceInfo => !!iface && iface.family === "IPv4" && !iface.internal)
  .map((iface) => iface.address);

const nextConfig: NextConfig = {
  // `127.0.0.1` is a different origin from `localhost`, and it is what the
  // Playwright config points at, so it has to be allow-listed too.
  allowedDevOrigins: [...lanAddresses, "*.local", "localhost", "127.0.0.1"],
  images: {
    // Next 16 only allows quality 75 by default; slabs are rendered at 90.
    qualities: [75, 90],
  },
  async headers() {
    return [
      { source: "/media/:path*", headers: immutable },
      { source: "/cards/:path*", headers: immutable },
    ];
  },
  // `cacheComponents` (PPR) is intentionally left off: the machine page reads
  // cookies at request time and is served as full dynamic SSR (see README).
};

export default nextConfig;
