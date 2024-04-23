declare namespace App {
	interface Locals {
		getActionResult: <T extends (...args: any) => any>(
			action: T
		) => Promise<Awaited<ReturnType<T>> | undefined>;
	}
}

declare module 'astro:actions' {
	export * from '@astrojs/actions/virtual';
}
