export default {
  name: '@test/custom-element-renderer',
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
        include: ['@test/custom-element-renderer/polyfill.js', '@test/custom-element-renderer/hydration-polyfill.js'],
				exclude: ['@test/custom-element-renderer/server.js']
      }
    }
  }
};
