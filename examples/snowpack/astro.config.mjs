export default {
  projectRoot: '.',
  pages: './src/pages',
  dist: './dist',
  public: './public',
  renderers: [
    '@astrojs/renderer-vue',
    '@astrojs/renderer-svelte',
    '@astrojs/renderer-preact'
  ]
};
