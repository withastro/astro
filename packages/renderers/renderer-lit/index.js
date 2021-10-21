export default {
  name: '@astrojs/renderer-lit',
  server: './server.js',
  polyfills: ['./client-shim.js'],
  hydrationPolyfills: ['./hydration-support.js'],
  viteConfig() {
    return {
      optimizeDeps: {
        include: [
          '@astrojs/renderer-lit/client-shim.js',
          '@astrojs/renderer-lit/hydration-support.js',
          '@webcomponents/template-shadowroot/template-shadowroot.js',
          'lit/experimental-hydrate-support.js',
        ],
      },
      ssr: {
        external: [
          'lit-element/lit-element.js',
          '@lit-labs/ssr/lib/install-global-dom-shim.js',
          '@lit-labs/ssr/lib/render-lit-html.js',
          '@lit-labs/ssr/lib/lit-element-renderer.js',
        ],
      },
    };
  },
};
