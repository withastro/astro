import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [
    {
      name: '404-integration',
      hooks: {
        'astro:config:setup': ({ injectRoute }) => {
          injectRoute({
            pattern: '404',
            entryPoint: 'src/404.astro',
          });
        },
      },
    },
  ],
});
