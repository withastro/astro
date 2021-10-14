import vue from '@vitejs/plugin-vue';

export default {
  name: '@astrojs/renderer-vue',
  client: './client.js',
  server: './server.js',
  knownEntrypoints: ['vue', '@vue/server-renderer'],
  vitePlugins: [vue()],
};
