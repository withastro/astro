import { builtinDrivers } from 'unstorage';
const unstorageDrivers = Object.fromEntries(
	Object.entries(builtinDrivers)
		.filter(([name]) => !name.includes('-'))
		.map(([name, entrypoint]) => [
			name,
			name === 'fs'
				? (config) => ({
						entrypoint: builtinDrivers.fsLite,
						config: {
							base: '.astro/session',
							...config,
						},
					})
				: (config) => ({
						entrypoint,
						config,
					}),
		]),
);
const sessionDrivers = unstorageDrivers;
export { sessionDrivers };
