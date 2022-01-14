import { installWindowOnGlobal } from "@lit-labs/ssr/lib/dom-shim.js";
console.log('before', typeof window);
installWindowOnGlobal();
console.log('after', typeof window, typeof globalThis.window);
window.global = window;

document.getElementsByTagName = () => [];
