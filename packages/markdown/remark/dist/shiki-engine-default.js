import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
function loadShikiEngine() {
	return createOnigurumaEngine(import('shiki/wasm'));
}
export { loadShikiEngine };
