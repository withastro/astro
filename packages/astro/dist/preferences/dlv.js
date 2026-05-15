import { FORBIDDEN_PATH_KEYS } from '@astrojs/internal-helpers/object';
function dlv(obj, key) {
	for (const k of key.split('.')) {
		if (FORBIDDEN_PATH_KEYS.has(k) || !obj || typeof obj !== 'object' || !Object.hasOwn(obj, k)) {
			return void 0;
		}
		obj = obj[k];
	}
	return obj;
}
export { dlv as default };
