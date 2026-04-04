import type { CacheProviderConfig } from "astro";

export function cloudflareCDNCache(): CacheProviderConfig {
  return {
    entrypoint: '@astrojs/cloudflare/cdn-cache',
  };
}
