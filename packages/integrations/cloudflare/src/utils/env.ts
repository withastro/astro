import type { GetEnv } from 'astro/env/setup';

export const createGetEnv =
	(env: Record<string, unknown>): GetEnv =>
	(key) => {
		const v = env[key];
		if (typeof v === 'undefined' || typeof v === 'string') {
			return v;
		}
		if (typeof v === 'boolean' || typeof v === 'number') {
			// let astro:env handle the validation and transformation
			return v.toString();
		}
		return undefined;
	};
