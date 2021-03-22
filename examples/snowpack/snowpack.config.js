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
  packageOptions: {
    external: [
      'node-fetch'
    ]
  },
  buildOptions: {
    out: '_site',
  },
  optimize: {
    bundle: true,
    minify: true,
    target: 'es2018',
  },
};
