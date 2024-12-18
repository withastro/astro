import { defineFontProvider } from './helpers.js';

export function adobe(config: { apiKey: string }) {
	return defineFontProvider({
		name: 'adobe',
		entrypoint: 'astro/assets/fonts/providers/adobe',
		config,
	});
}

export function test() {
	return defineFontProvider({
		name: 'test',
		entrypoint: 'astro/assets/fonts/providers/test',
	});
}
