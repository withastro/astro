import type { ModuleLoader } from '../../module-loader/index';
import { resolveIdToUrl } from '../../util.js';

export function createResolve(loader: ModuleLoader) {
	// Resolves specifiers in the inline hydrated scripts, such as:
	// - @astrojs/preact/client.js
	// - @/components/Foo.vue
	// - /Users/macos/project/src/Foo.vue
	// - C:/Windows/project/src/Foo.vue (normalized slash)
	return async function (s: string) {
		const url = await resolveIdToUrl(loader, s);
		// Vite does not resolve .jsx -> .tsx when coming from hydration script import,
		// clip it so Vite is able to resolve implicitly.
		if (url.startsWith('/@fs') && url.endsWith('.jsx')) {
			return url.slice(0, -4);
		} else {
			return url;
		}
	};
}
