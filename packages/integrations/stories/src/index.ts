import type { AstroConfig, AstroIntegration } from 'astro';
import { ssr, preload } from 'astro/core/render/dev';
import { renderComponent } from 'astro/internal/index.js';
import { fileURLToPath } from 'url';
import { createProject } from '@ts-morph/bootstrap'

async function getViteConfiguration() {
	const project = await createProject();
	return {
		plugins: [{
			name: '@astrojs/stories',
			enforce: 'pre',
			transform(code, id, opts) {
				if (opts?.ssr !== true) return;
				if (/\.[cm]?js(\?.*)?$/.test(id)) return null;
				if (/\.css(\?.*)?$/.test(id)) return null;
				if (/^plugin-vue/.test(id)) return null;
				if (/stories\.astro/.test(id)) return null;

				// TODO: get Props and attach to `test`
				return { meta: { ['@astrojs/stories']: { test: true } } };
			}
		}]
	};
}

export default function createPlugin(): AstroIntegration {
	let config: AstroConfig;
	return {
		name: '@astrojs/stories',
		hooks: {
			'astro:config:setup': async ({ updateConfig }) => {
				return updateConfig({
					vite: await getViteConfiguration(),
				});
			},
			'astro:config:done': ({ config: _config }) => {
				config = _config;
			},
			'astro:server:setup': ({ server }) => {
				server.middlewares.use('/stories', async (req, res, next) => {
					const origin = `${server.config.server.https ? 'https' : 'http'}://${req.headers.host}`;
					const url = new URL(origin + req.url);
					const pathname = decodeURI(url.pathname)
					const rootRelativeComponentPath = url.searchParams.get('path');
					let exportName = url.searchParams.get('export');
					let componentProps = url.searchParams.has('props') ? JSON.parse(url.searchParams.get('props')) : {};
					const componentPath = rootRelativeComponentPath ? new URL(`.${rootRelativeComponentPath}`, config.root) : undefined;
					const pagePath = new URL('../stories.astro', import.meta.url);
					const mod = componentPath ? (await server.ssrLoadModule(fileURLToPath(componentPath), true)) : undefined;
					let component;
					if (mod) {
						const { info: { meta: { ['@astrojs/stories']: metadata } } } = await server.moduleGraph.getModuleByUrl(fileURLToPath(componentPath));
						console.log({ metadata });
						if (exportName && !(exportName in mod)) {
							console.log(`Unable to resolve export "${exportName}" from "${fileURLToPath(componentPath)}"`);
						}
						if (!exportName) {
							const exportNames = Object.keys(mod);
							if (exportNames?.length === 1) {
								exportName = exportNames[0]
							} else {
								exportName = 'default';
							}
						}
						component = mod[exportName];
						if (component.isAstroComponentFactory) {
							componentProps = { ...componentProps };
						} else {
							componentProps = { ...componentProps, 'client:idle': true, 'client:component-path': componentPath.pathname, 'client:component-export': exportName };
						}
					}
					const preloadedPage = await preload({ astroConfig: config, filePath: pagePath, viteServer: server });

					const options = {
						astroConfig: config,
						filePath: pagePath,
						mode: 'development',
						origin,
						pathname,
						viteServer: server,
						request: new Request(new URL(origin + req.url).toString()),
						createSlots: component ? {
							default: (result: any) => renderComponent(result, component['name'], component, componentProps, {})
						} : undefined
					};

					const { html } = await ssr(preloadedPage, options);
					res.writeHead(200, {
						'Content-Type': 'text/html; charset=utf-8',
						'Content-Length': Buffer.byteLength(html, 'utf-8'),
					});
					res.write(html);
					res.end();
				});
			},
		},
	};
}
