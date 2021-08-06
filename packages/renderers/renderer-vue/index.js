import vue from '@vitejs/plugin-vue';

export default {
  name: '@astrojs/renderer-vue',
  client: './client',
  server: './server',
  knownEntrypoints: ['vue', '@vue/server-renderer'],
  vitePlugins: [vue()],
};
