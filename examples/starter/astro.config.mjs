// Full Astro Configuration API Documentation:
// https://docs.astro.build/reference/configuration-reference
import Icons from 'unplugin-icons/vite';

// @type-check enabled!
// VSCode and other TypeScript-enabled text editors will provide auto-completion,
// helpful tooltips, and warnings if your exported object is invalid.
// You can disable this by removing "@ts-check" and `@type` comments below.

// TODO: Adding assets to a vite plugin is hard
// needs to handle load response, adding asset via middleware, AND adding asset via generateBundle
// use https://api.giphy.com/v1/gifs/search?q=paul+rudd&api_key=dc6zaTOxFJmzC
// function createUnsplashPlugin() {
// const virtualModuleId = 'astro:unsplash'
// const resolvedVirtualModuleId = '\0' + virtualModuleId;
// return {
// 	resolveId(id) {
// 		if (id.startsWith(virtualModuleId)) {
// 			return '\0' + id;
// 		}
// 	},
// 	async load(id) {
// 		const lookup = 'astronaut';

// 	}
// }
// };

// INSTEAD DO: https://github.com/antfu/unplugin-icons
// but, set up load src/fonts
// function createFontawesomePlugin() {

// };

// INSTEAD DO: https://github.com/feat-agency/vite-plugin-webfont-dl
// but, hook it via imports instead of CSS injection
function createFontsPlugin() {}

// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
	// Set "renderers" to "[]" to disable all default, builtin component support.
	// renderers: [],
	/*

	
	icons: {include: ['fa-solid', 'fa-brand']},
	
	
	*/
	fonts: ['roboto@400', 'roboto@700', 'roboto-slab'],
	vite: {
		plugins: [
			Icons({
				compiler: 'raw',
			}),
		],
	},
});
