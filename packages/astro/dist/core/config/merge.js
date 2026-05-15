import { mergeConfig as mergeViteConfig } from 'vite';
import { arraify, isObject, isURL } from '../util-runtime.js';
function mergeConfigRecursively(defaults, overrides, rootPath) {
	const merged = { ...defaults };
	for (const key in overrides) {
		const value = overrides[key];
		if (value == null) {
			continue;
		}
		const existing = merged[key];
		if (existing == null) {
			merged[key] = value;
			continue;
		}
		if (key === 'vite' && rootPath === '') {
			merged[key] = mergeViteConfig(existing, value);
			continue;
		}
		if (key === 'server' && rootPath === '') {
			if (typeof existing === 'function' || typeof value === 'function') {
				merged[key] = (...args) => {
					const existingConfig = typeof existing === 'function' ? existing(...args) : existing;
					const valueConfig = typeof value === 'function' ? value(...args) : value;
					return mergeConfigRecursively(existingConfig, valueConfig, key);
				};
				continue;
			}
		}
		if (
			key === 'allowedHosts' &&
			rootPath === 'server' &&
			(typeof existing === 'boolean' || typeof value === 'boolean')
		) {
			merged[key] = typeof value === 'boolean' ? value : existing;
			continue;
		}
		if (Array.isArray(existing) || Array.isArray(value)) {
			merged[key] = [...arraify(existing ?? []), ...arraify(value ?? [])];
			continue;
		}
		if (isURL(existing) && isURL(value)) {
			merged[key] = value;
			continue;
		}
		if (isObject(existing) && isObject(value)) {
			merged[key] = mergeConfigRecursively(existing, value, rootPath ? `${rootPath}.${key}` : key);
			continue;
		}
		merged[key] = value;
	}
	return merged;
}
function mergeConfig(defaults, overrides) {
	return mergeConfigRecursively(defaults, overrides, '');
}
export { mergeConfig };
