export default {
  projectRoot: '.',
  astroRoot: './src',
  dist: './dist',
  public: './public',
  extensions: {
    '.jsx': 'react',
  },
  snowpack: {
    optimize: {
      bundle: false,
      minify: true,
      target: 'es2018',
    },
  },
};
