export default {
  projectRoot: '.',
  astroRoot: './astro',
  dist: './_site',
  public: './public',
  extensions: {
    '.jsx': 'preact',
  },
  snowpack: {
    optimize: {
      bundle: false,
      minify: true,
      target: 'es2018',
    },
  },
};
