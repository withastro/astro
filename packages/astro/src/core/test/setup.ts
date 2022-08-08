import { polyfill } from "@astrojs/webapi";

polyfill(globalThis, {
	exclude: 'document window'
})
