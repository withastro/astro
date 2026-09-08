import { builtinDrivers, type BuiltinDriverOptions } from 'unstorage';
import type { SessionDriverConfig } from './types.js';

type WithoutDash<T> = T extends `${string}-${string}` ? never : T;

const unstorageDrivers = Object.fromEntries(
	Object.entries(builtinDrivers)
		.filter(([name]) => !name.includes('-'))
		.map(([name, entrypoint]) => [
			name,
			name === 'fs'
				? (config: any): SessionDriverConfig => ({
						entrypoint: builtinDrivers.fsLite,
						config: {
							base: '.astro/session',
							...config,
						},
					})
				: (config: any): SessionDriverConfig => ({
						entrypoint,
						config,
					}),
		]),
) as unknown as {
	[K in WithoutDash<keyof BuiltinDriverOptions> & keyof BuiltinDriverOptions]: (
		config?: BuiltinDriverOptions[K],
	) => SessionDriverConfig;
};

export const sessionDrivers = unstorageDrivers;
