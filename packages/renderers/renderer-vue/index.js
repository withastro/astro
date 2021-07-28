export default {
  name: '@astrojs/renderer-vue',
  snowpackPlugin: '@snowpack/plugin-vue',
  client: './client',
  server: './server',
  knownEntrypoints: ['vue'],
};
