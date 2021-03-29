export default {
  projectRoot: '.',
  astroRoot: './astro',
  dist: './_site',
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
