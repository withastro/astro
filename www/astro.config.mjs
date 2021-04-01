import prismAstro from 'prism-astro/astro-plugin';

export default {
  projectRoot: '.',
  astroRoot: './astro',
  dist: './_site',
  plugins: [prismAstro()]
};