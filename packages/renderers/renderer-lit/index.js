export default {
  name: '@astrojs/renderer-lit',
  server: './server.js',
  external: ['@lit-labs/ssr/lib/install-global-dom-shim.js', '@lit-labs/ssr/lib/render-lit-html.js', '@lit-labs/ssr/lib/lit-element-renderer.js'],
  polyfills: ['./client-shim.js'],
  hydrationPolyfills: ['lit/experimental-hydrate-support.js'],
  knownEntrypoints: ['@astrojs/renderer-lit/client-shim.js', '@webcomponents/template-shadowroot/template-shadowroot.js'],
};
