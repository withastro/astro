declare module 'astro:react:opts' {
	type Options = Pick<
		import('./src/index.js').ReactIntegrationOptions,
		'experimentalDisableStreaming' | 'experimentalReactChildren'
	>;
	const options: Options;
	export = options;
}
