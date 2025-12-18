import { builtinDrivers, type BuiltinDriverOptions } from 'unstorage';
import type { SessionDriverConfig } from './types.js';

type WithoutDash<T> = T extends `${string}-${string}` ? never : T;

const unstorageDrivers = Object.fromEntries(
	Object.entries(builtinDrivers)
		.filter(([name]) => !name.includes('-'))
		.map(([name, entrypoint]) => [
			name,
			name === 'fs'
				? (options: any): SessionDriverConfig => ({
						entrypoint: builtinDrivers.fsLite,
						options: {
							base: '.astro/session',
							...options,
						},
					})
				: (options: any): SessionDriverConfig => ({
						entrypoint,
						options,
					}),
		]),
) as unknown as {
	[K in WithoutDash<keyof BuiltinDriverOptions> & keyof BuiltinDriverOptions]: (
		options?: BuiltinDriverOptions[K],
	) => SessionDriverConfig;
};

export const sessionDrivers = unstorageDrivers;
