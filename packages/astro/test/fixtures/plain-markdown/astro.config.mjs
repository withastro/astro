export default {
  renderers: [
    '@astrojs/renderer-preact'
  ],
  buildOptions: {
    sitemap: false,
  },
  markdownOptions: {
    defaultLayout: '../layouts/default.astro'
  }
};
