
export default {
  name: '@astrojs/test-custom-element-renderer',
  client: './client',
  server: './server',
  hydrationMethod: 'self',
  polyfills: [
    './polyfill.js'
  ]
};
