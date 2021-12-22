import { imagetools } from 'vite-imagetools';

// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
  renderers: ['@astrojs/renderer-vue'],
  vite: {
    plugins: [imagetools()],
  },
});
