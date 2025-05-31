import { defineConfig } from 'astro/config';

export default defineConfig({
  svg: {
    optimize: true,
    svgoConfig: {
      plugins: [
        'preset-default',
        {
          name: 'removeViewBox',
          active: false
        }
      ]
    }
  }
});
