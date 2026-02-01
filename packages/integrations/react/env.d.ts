declare module 'astro:react:opts' {
	type Options = Pick<
		import('./src/index.js').ReactIntegrationOptions,
		'experimentalDisableStreaming' | 'experimentalReactChildren'
	>;
	const options: Options;
	export = options;
}

declare module 'virtual:astro:react-app' {
	import type { ComponentType } from 'react';
	import type { AppEntrypointProps } from './src/index.js';
	export const AppEntrypoint: ComponentType<AppEntrypointProps> | undefined;
}
