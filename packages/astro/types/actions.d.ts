declare module 'astro:actions' {
	export * from 'astro/actions/runtime/server.js';

	export function getActionPath(
		action: import('astro/actions/runtime/server.js').ActionClient<any, any, any>,
	): string;
}
