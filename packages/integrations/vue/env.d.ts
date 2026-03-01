declare module 'virtual:astro:vue-app' {
	export const setup: (app: import('vue').App<Element>) => void | Promise<void>;
}
