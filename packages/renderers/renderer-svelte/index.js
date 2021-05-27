export default {
  name: '@astrojs/renderer-svelte',
  snowpackPlugin: '@snowpack/plugin-svelte',
  snowpackPluginOptions: { compilerOptions: { hydratable: true } },
  client: './client',
  server: './server',
};
