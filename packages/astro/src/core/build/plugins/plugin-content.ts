import type { Plugin as VitePlugin } from 'vite';
import fsMod from 'node:fs';
import { addRollupInput } from '../add-rollup-input.js';
import { type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
import { generateContentEntryFile, generateLookupMap } from '../../../content/vite-plugin-content-virtual-mod.js';
import { joinPaths } from '../../path.js';
import { fileURLToPath } from 'node:url';
import type { ContentLookupMap } from '../../../content/utils.js';
import { CONTENT_RENDER_FLAG } from '../../../content/consts.js';
import glob from 'fast-glob';
import { dirname } from 'node:path';

function vitePluginContent(opts: StaticBuildOptions, lookupMap: ContentLookupMap, _internals: BuildInternals): VitePlugin {

	return {
		name: '@astro/plugin-build-content',

		options(options) {
			let newOptions = Object.assign({}, options);
			if (opts.settings.config.output === 'static') {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				for (const [_collectionName, { type, entries }] of Object.entries(lookupMap)) {
					let newInputs = Object.values(entries).flatMap(entry => {
						const input = fileURLToPath(joinPaths(opts.settings.config.root.toString(), entry));
						const inputs = [`${input}?${collectionTypeToFlag(type)}`];
						if (type === 'content') {
							inputs.push(`${input}?${CONTENT_RENDER_FLAG}`)
						}
						return inputs;
					})
					newOptions = addRollupInput(newOptions, newInputs)
				}
			}
			return newOptions;
		},

		async generateBundle() {
			const content = await generateContentEntryFile({ settings: opts.settings, fs: fsMod, lookupMap });
			this.emitFile({
				type: 'prebuilt-chunk',
				code: content,
				fileName: 'content/index.mjs'
			})
		},

		async writeBundle(options, bundle) {
			const dist = options.dir!
			const cache = dist.replace('dist', 'node_modules/.astro/content-cache')
			const callbacks: (() => void)[] = [];
			if (fsMod.existsSync(cache)) {
				const cachedFiles = await glob('**/*', {
					cwd: cache,
					onlyFiles: true
				})
				for (const file of cachedFiles) {
					const filePath = joinPaths(dist, file);
					const cachePath = joinPaths(cache, file);
					callbacks.push(() => {
						fsMod.mkdirSync(dirname(filePath), { recursive: true })
						fsMod.copyFileSync(cachePath, filePath, fsMod.constants.COPYFILE_FICLONE)
					})
				}
			} else {
				fsMod.mkdirSync(cache, { recursive: true })
				for (const [file, chunk] of Object.entries(bundle)) {
					const cachePath = joinPaths(cache, file);
					callbacks.push(() => {
						fsMod.mkdirSync(dirname(cachePath), { recursive: true })
						if (chunk.type === 'chunk') {
							fsMod.writeFileSync(cachePath, chunk.code, { encoding: 'utf8' })
						} else {
							fsMod.writeFileSync(cachePath, chunk.source)
						}
					})
				}
			}
			for (const cb of callbacks) {
				cb();
			}
		}
	};
}

function collectionTypeToFlag(type: 'content' | 'data') {
	const name = type[0].toUpperCase() + type.slice(1);
	return `astro${name}CollectionEntry`
}

export function pluginContent(opts: StaticBuildOptions, internals: BuildInternals): AstroBuildPlugin {
	return {
		targets: ['content'],
		hooks: {
			async 'build:before'() {
				// TODO: filter lookupMap based on file hashes
				const lookupMap = await generateLookupMap({ settings: opts.settings, fs: fsMod });
				
				return {
					vitePlugin: vitePluginContent(opts, lookupMap, internals),
				};
			}
		},
	};
}
