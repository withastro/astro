import markdoc from '@astrojs/markdoc';
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

/** Resolves an image while the prerender bundle loads, outside of any render. */
const outsideRender = {
  name: 'outside-render',
  hooks: {
    'astro:config:setup': ({ addRenderer }) => {
      addRenderer({
        name: 'outside-render',
        serverEntrypoint: new URL('./src/outside-render.ts', import.meta.url),
      });
    },
  },
};

export default defineConfig({
  integrations: [mdx(), markdoc(), outsideRender],
});
