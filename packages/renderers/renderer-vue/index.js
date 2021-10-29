import vue from '@vitejs/plugin-vue';

export default {
  name: '@astrojs/renderer-vue',
  client: './client.js',
  server: './server.js',
  viteConfig() {
    return {
      optimizeDeps: {
        include: ['@astrojs/renderer-vue/client.js', 'vue'],
        exclude: ['@astrojs/renderer-vue/server.js'],
      },
      plugins: [vue()],
      ssr: {
        external: ['@vue/server-renderer'],
      },
    };
  },
};
