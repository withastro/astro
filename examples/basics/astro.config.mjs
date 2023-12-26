import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  base: '/src',
  vite: {
    plugins: [
      {
        name:'',
        configResolved(c) {
          console.log(c.base)
        }
      }
    ]
  }
});
