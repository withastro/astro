export default {
  name: '@astrojs/renderer-preact',
  client: './client',
  server: './server',
  knownEntrypoints: ['preact', 'preact/jsx-runtime', 'preact-render-to-string'],
  jsxImportSource: 'preact',
  jsxTransformOptions: async () => {
    const { default: { default: jsx }} = await import('@babel/plugin-transform-react-jsx');
    return {
      plugins: [
        jsx({}, { runtime: 'automatic', importSource: 'preact' })
      ]
    }
  }
};
