export default {
  buildOptions: {
    site: 'https://docs.astro.build/',
  },
  renderers: [
    // Our main renderer for frontend components
    '@astrojs/renderer-preact',
    // Needed for Algolia search component
    '@astrojs/renderer-react',
  ],
};
