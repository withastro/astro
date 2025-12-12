import { builtinDrivers, type BuiltinDriverName, type BuiltinDriverOptions } from 'unstorage';
import type { SessionDriverConfig } from './types.js';

type WithoutDash<T> = T extends `${string}-${string}` ? never : T;

const unstorageDrivers = Object.entries(builtinDrivers)
	.filter(([name]) => !name.includes('-'))
	.map(
		([name, entrypoint]) =>
			(options: any): SessionDriverConfig => ({
				name,
				options,
				entrypoint,
			}),
	) as unknown as {
	[K in WithoutDash<BuiltinDriverName> & keyof BuiltinDriverOptions]: (
		options?: BuiltinDriverOptions[K],
	) => SessionDriverConfig;
};

export const sessionDrivers = unstorageDrivers;
