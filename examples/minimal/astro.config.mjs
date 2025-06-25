// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: node({
    mode: 'standalone',
  }),
 
  integrations: [
    {
      name: 'config',
      hooks: {
        'astro:config:setup': ({ updateConfig }) => {
          updateConfig({
            base: '/blog',
            site: 'https://example.com',
            trailingSlash: 'always',
            i18n: {
              defaultLocale: 'en',
              locales: ['en', 'fr'],
              routing: {
                prefixDefaultLocale: false,
                redirectToDefaultLocale: true,
                fallbackType: 'rewrite',
              },
            },
          });
        },
      },
    },
  ],
});
