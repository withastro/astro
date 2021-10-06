import '@lit-labs/ssr/lib/install-global-dom-shim.js';
window.global = window;
document.getElementsByTagName = () => [];
