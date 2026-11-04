/// <reference types="vite/client" />

declare module 'virtual:astro:app-entrypoint/@astrojs/vue' {
	const load:
		| (() => Promise<{ default?: (app: import('vue').App<Element>) => void | Promise<void> }>)
		| undefined;
	export default load;
}
