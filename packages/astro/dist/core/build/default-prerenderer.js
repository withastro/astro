import { StaticPaths } from '../../runtime/prerender/static-paths.js';
function createDefaultPrerenderer({ internals, options, prerenderOutputDir }) {
	const prerenderer = {
		name: 'astro:default',
		async setup() {
			const prerenderEntryFileName = internals.prerenderEntryFileName;
			if (!prerenderEntryFileName) {
				throw new Error(
					`Prerender entry filename not found in build internals. This is likely a bug in Astro.`,
				);
			}
			const prerenderEntryUrl = new URL(prerenderEntryFileName, prerenderOutputDir);
			const prerenderEntry = await import(prerenderEntryUrl.toString());
			const app = prerenderEntry.app;
			app.setInternals(internals);
			app.setOptions(options);
			prerenderer.app = app;
		},
		async getStaticPaths() {
			const staticPaths = new StaticPaths(prerenderer.app);
			return staticPaths.getAll();
		},
		async render(request, { routeData }) {
			return prerenderer.app.render(request, { routeData });
		},
		async teardown() {},
	};
	return prerenderer;
}
export { createDefaultPrerenderer };
