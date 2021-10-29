export default {
  name: '@astrojs/test-custom-element-renderer',
  server: './server.js',
  polyfills: [
    './polyfill.js'
  ],
  hydrationPolyfills: [
    './hydration-polyfill.js'
  ],
  viteConfig() {
    return {
      optimizeDeps: {
        include: ['@astrojs/test-custom-element-renderer/polyfill.js', '@astrojs/test-custom-element-renderer/hydration-polyfill.js']
      }
    }
  }
};
