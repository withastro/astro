import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';

type DirectiveLoader = (get: GetHydrateCallback, opts: HydrateOptions, root: HTMLElement) => void;

declare global {
	interface Window {
		Astro: {
			idle: DirectiveLoader;
			load: DirectiveLoader;
			media: DirectiveLoader;
			only: DirectiveLoader;
			visible: DirectiveLoader;
		};
	}
}

export {};
