/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  
  mount: {
    public: '/',
    //src: '/_dist_',
  },
  plugins: [
    ['@snowpack/plugin-sass', { compilerOptions: { style: 'compressed' } }],
    '@snowpack/plugin-svelte',
    '@snowpack/plugin-vue',
  ],
  packageOptions: {},
  buildOptions: {
    out: '_site',
  },
  optimize: {
    bundle: false,
    minify: true,
    target: 'es2018',
  },
};
