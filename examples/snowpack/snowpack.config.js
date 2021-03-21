/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  
  mount: {
    public: '/',
    //src: '/_dist_',
  },
  plugins: [
    [
      '@snowpack/plugin-sass', { compilerOptions: { style: 'compressed' } },
    ],
    '@snowpack/plugin-svelte',
    '@snowpack/plugin-vue'
  ],
  packageOptions: {
    external: [
      'node-fetch'
    ]
  },
  devOptions: {
    // Eleventy updates multiple files at once, so add a 1000ms delay before we trigger a browser update
    hmrDelay: 1000,
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
