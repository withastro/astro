import type { AstroPluginMetadata } from '../../vite-plugin-astro/index.js';
import type { AstroSettings, ComponentInstance } from '../../@types/astro.js';
import type { ViteDevServer, Plugin as VitePlugin } from 'vite';

export const VIRTUAL_ISLAND_MAP_ID = '@astro-server-islands';
export const RESOLVED_VIRTUAL_ISLAND_MAP_ID = '\0' + VIRTUAL_ISLAND_MAP_ID;
const serverIslandPlaceholder = '\'$$server-islands$$\'';

export function vitePluginServerIslands({ settings }: { settings: AstroSettings }): VitePlugin {
	let viteServer: ViteDevServer | null = null;
	const referenceIdMap = new Map<string, string>();
	return {
		name: 'astro:server-islands',
		enforce: 'post',
		configureServer(_server) {
			viteServer = _server;
		},
		resolveId(name) {
			if(name === VIRTUAL_ISLAND_MAP_ID) {
				return RESOLVED_VIRTUAL_ISLAND_MAP_ID;
			}
		},
		load(id) {
			if(id === RESOLVED_VIRTUAL_ISLAND_MAP_ID) {
				return `export const serverIslandMap = ${serverIslandPlaceholder};`;
			}
		},
		transform(code, id, options) {
			if(id.endsWith('.astro')) {
				const info = this.getModuleInfo(id);
				if(info?.meta) {
					const astro = info.meta.astro as AstroPluginMetadata['astro'] | undefined;
					if(astro?.serverComponents.length) {
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

								// Append the name map, for prod
								settings.serverIslandNameMap.set(comp.resolvedPath, name);

								settings.serverIslandMap.set(name, () => {
									return viteServer?.ssrLoadModule(comp.resolvedPath) as any;
								});

								// Build mode
								if(!viteServer) {
									let referenceId = this.emitFile({
										type: 'chunk',
										id: comp.specifier,
										importer: id,
										name: comp.localName
									});

									referenceIdMap.set(comp.resolvedPath, referenceId);
								}
							}
						}
					}
				}
			}
		},
		generateBundle(options, bundles) {
			let mapSource = 'new Map([';
			for(let [resolvedPath, referenceId] of referenceIdMap) {
				const fileName = this.getFileName(referenceId);
				const islandName = settings.serverIslandNameMap.get(resolvedPath)!;
				mapSource += `\n\t['${islandName}', () => import('./${fileName}')],`
			}
			mapSource += '\n]);';
			referenceIdMap.clear();

			for (const [fileName, output] of Object.entries(bundles)) {
				if(output.type !== 'chunk') continue;

				//console.log("OUTPUT", output.code);

				if(output.code.includes(serverIslandPlaceholder)) {
					output.code = output.code.replace(serverIslandPlaceholder, mapSource);
				}
			}
		}
	}
}
