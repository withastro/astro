declare module 'astro:react:opts' {
	const options: import('./src/types.js').VirtualModuleOptions;
	export default options;
}

declare module 'virtual:astro:react-app' {
	import type { ComponentType } from 'react';
	import type { AppEntrypointProps } from './src/index.js';
	export const AppEntrypoint: ComponentType<AppEntrypointProps> | undefined;
}
