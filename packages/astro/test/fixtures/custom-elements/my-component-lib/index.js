export default {
  name: '@astrojs/test-custom-element-renderer',
  server: './server.js',
  polyfills: [
    './polyfill.js'
  ],
  hydrationPolyfills: [
    './hydration-polyfill.js'
  ]
};
