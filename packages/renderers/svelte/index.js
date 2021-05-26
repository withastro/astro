export default {
  name: '@astro-renderer/svelte',
  snowpackPlugin: '@snowpack/plugin-svelte',
  snowpackPluginOptions: { compilerOptions: { hydratable: true } },
  client: './client',
  server: './server',
};
