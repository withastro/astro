export default {
  markdownOptions: {
    components: './src/components/index.js'
  },
  renderers: [
    '@astrojs/renderer-preact'
  ],
  buildOptions: {
    sitemap: false,
  },
};
