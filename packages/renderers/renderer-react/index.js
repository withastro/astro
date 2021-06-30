export default {
  name: '@astrojs/renderer-react',
  client: './client',
  server: './server',
  knownEntrypoints: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/server'],
  jsxImportSource: 'react',
};
