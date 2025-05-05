// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  experimental: {
    fonts: [
      {
        provider: fontProviders.adobe({ id: process.env.KIT_ID ?? '' }),
        name: 'Effra',
        cssVariable: '--font-effra',
        fallbacks: ['sans-serif'],
        weights: ['300', '400', '700'],
        styles: ['normal'],
      },
    ],
  },
});
