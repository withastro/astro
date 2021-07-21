export default {
  name: '@astrojs/renderer-react',
  client: './client',
  server: './server',
  knownEntrypoints: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/server.js'],
  jsxImportSource: 'react',
  jsxTransformOptions: async () => {
    const { default: { default: jsx }} = await import('@babel/plugin-transform-react-jsx');
    return {
      plugins: [
        jsx({}, { runtime: 'automatic', importSource: 'react' })
      ]
    }
  }
};
