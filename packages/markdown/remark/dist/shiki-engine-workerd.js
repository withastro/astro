import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
function loadShikiEngine() {
	return createOnigurumaEngine(import('shiki/onig.wasm'));
}
export { loadShikiEngine };
