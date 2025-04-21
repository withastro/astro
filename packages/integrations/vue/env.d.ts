declare module 'virtual:@astrojs/vue/app' {
	export const setup: (app: import('vue').App<Element>) => void | Promise<void>;
}
