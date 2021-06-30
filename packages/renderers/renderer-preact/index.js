export default {
  name: '@astrojs/renderer-preact',
  client: './client',
  server: './server',
  knownEntrypoints: ['preact', 'preact/jsx-runtime', 'preact-render-to-string'],
  jsxImportSource: 'preact',
};
