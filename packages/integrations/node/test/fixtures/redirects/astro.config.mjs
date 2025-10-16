import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
	adapter: nodejs({ mode: 'standalone' }),
  redirects: {
    '/old-page': '/new-page',
    '/old-page-301': {
      status: 301,
      destination: '/new-page-301',
    },
    '/old-page-302': {
      status: 302,
      destination: '/new-page-302',
    },
    '/dynamic/[slug]': '/pages/[slug]',
    '/spread/[...path]': '/content/[...path]',
    '/external': 'https://example.com',
  },
});
