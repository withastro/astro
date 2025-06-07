import { mergeConfig as mergeViteConfig } from 'vite';
import type { DeepPartial } from '../../type-utils.js';
import type { AstroConfig, AstroInlineConfig } from '../../types/public/index.js';
import { arraify, isObject, isURL } from '../util.js';

function mergeConfigRecursively(
	defaults: Record<string, any>,
	overrides: Record<string, any>,
	rootPath: string,
) {
	const merged: Record<string, any> = { ...defaults };
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

		// fields that require special handling:
		if (key === 'vite' && rootPath === '') {
			merged[key] = mergeViteConfig(existing, value);
			continue;
		}
		if (key === 'server' && rootPath === '') {
			// server config can be a function or an object, if one of the two values is a function,
			// create a new wrapper function that merges them
			if (typeof existing === 'function' || typeof value === 'function') {
				merged[key] = (...args: any[]) => {
					const existingConfig = typeof existing === 'function' ? existing(...args) : existing;
					const valueConfig = typeof value === 'function' ? value(...args) : value;
					return mergeConfigRecursively(existingConfig, valueConfig, key);
				};
				continue;
			}
		}

		// for server.allowedHosts, if the value is a boolean
		if (key === 'allowedHosts' && rootPath === 'server' && typeof existing === 'boolean') {
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

export function mergeConfig<C extends AstroConfig | AstroInlineConfig>(
	defaults: C,
	overrides: DeepPartial<C>,
): C {
	return mergeConfigRecursively(defaults, overrides, '') as C;
}
