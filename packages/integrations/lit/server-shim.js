import { installWindowOnGlobal } from '@lit-labs/ssr/lib/dom-shim.js';
installWindowOnGlobal();

window.global = window;
document.getElementsByTagName = () => [];
// See https://github.com/lit/lit/issues/2393
document.currentScript = null;
