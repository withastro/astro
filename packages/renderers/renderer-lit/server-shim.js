import '@lit-labs/ssr/lib/install-global-dom-shim.js';
if(typeof window !== 'undefined') {
	window.global = window;
	document.getElementsByTagName = () => [];
}
