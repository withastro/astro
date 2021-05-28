export default {
  projectRoot: '.',
  pages: './src/pages',
  dist: './dist',
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
