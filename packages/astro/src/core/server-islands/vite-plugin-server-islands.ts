import type { AstroPluginMetadata } from '../../vite-plugin-astro/index.js';
import type { AstroSettings, ComponentInstance } from '../../@types/astro.js';
import type { ViteDevServer, Plugin as VitePlugin } from 'vite';

export function vitePluginServerIslands({ settings }: { settings: AstroSettings }): VitePlugin {
	let viteServer: ViteDevServer | null = null;
	return {
		name: 'astro:server-islands',
		enforce: 'post',
		configureServer(_server) {
			viteServer = _server;
		},
		transform(code, id, options) {
			if(id.endsWith('.astro')) {
				const info = this.getModuleInfo(id);
				if(info?.meta) {
					const astro = info.meta.astro as AstroPluginMetadata['astro'] | undefined;
					if(astro?.serverComponents.length) {
						if(viteServer) {
							for(const comp of astro.serverComponents) {
								if(!settings.serverIslandNameMap.has(comp.resolvedPath)) {
									let name = comp.localName;
									let idx = 1;

									while(true) {
										// Name not taken, let's use it.
										if(!settings.serverIslandMap.has(name)) {
											break;
										}
										// Increment a number onto the name: Avatar -> Avatar1
										name += idx++;
									}
									settings.serverIslandNameMap.set(comp.resolvedPath, name);
									settings.serverIslandMap.set(name, () => {
										return viteServer?.ssrLoadModule(comp.resolvedPath) as any;
									});
								}
							}
						}
					}
				}
			}
		}
	}
}
