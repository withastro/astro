import type { CacheProviderFactory } from 'astro';

const factory: CacheProviderFactory = () => {
  return {
    name: 'cloudflare-cdn-cache',
    setHeaders(options) {
      const headers = new Headers();
      if (options.maxAge !== undefined) {
        let value = `max-age=${options.maxAge}`;
        if (options.swr !== undefined) {
          value += `, stale-while-revalidate=${options.swr}`;
        }
        headers.set('Cloudflare-CDN-Cache-Control', value);
      }
      if (options.tags?.length) {
        headers.set('Cache-Tag', options.tags.join(','));
      }
      return headers;
    },

    async invalidate() {
      // noop for now, since users would need to use Cloudflare's dashboard to purge everything or custom logic
    },
  };
};

export default factory;