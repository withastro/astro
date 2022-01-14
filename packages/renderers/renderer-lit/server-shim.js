import { installWindowOnGlobal } from "@lit-labs/ssr/lib/dom-shim.js";
installWindowOnGlobal();

window.global = window;
document.getElementsByTagName = () => [];
