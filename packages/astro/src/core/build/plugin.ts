import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions, ViteBuildReturn } from './types.js';

type RollupOutputArray = Extract<ViteBuildReturn, Array<any>>;
type OutputChunkorAsset = RollupOutputArray[number]['output'][number];
type OutputChunk = Extract<OutputChunkorAsset, { type: 'chunk' }>;

type MutateChunk = (chunk: OutputChunk, build: 'server' | 'client', newCode: string) => void;

export type AstroBuildPlugin = {
	build: 'ssr' | 'client' | 'both';
	hooks?: {
		'build:before'?: (opts: { build: 'ssr' | 'client'; input: Set<string> }) => {
			enforce?: 'after-user-plugins';
			vitePlugin: VitePlugin | VitePlugin[] | undefined;
		};
		'build:post'?: (opts: {
			ssrOutputs: RollupOutputArray;
			clientOutputs: RollupOutputArray;
			mutate: MutateChunk;
		}) => void | Promise<void>;
	};
};

export function createPluginContainer(options: StaticBuildOptions, internals: BuildInternals) {
	const clientPlugins: AstroBuildPlugin[] = [];
	const ssrPlugins: AstroBuildPlugin[] = [];
	const allPlugins = new Set<AstroBuildPlugin>();

	return {
		options,
		internals,
		register(plugin: AstroBuildPlugin) {
			allPlugins.add(plugin);
			switch (plugin.build) {
				case 'client': {
					clientPlugins.push(plugin);
					break;
				}
				case 'ssr': {
					ssrPlugins.push(plugin);
					break;
				}
				case 'both': {
					clientPlugins.push(plugin);
					ssrPlugins.push(plugin);
					break;
				}
			}
		},

		// Hooks
		runBeforeHook(build: 'ssr' | 'client', input: Set<string>) {
			let plugins = build === 'ssr' ? ssrPlugins : clientPlugins;
			let vitePlugins: Array<VitePlugin | VitePlugin[]> = [];
			let lastVitePlugins: Array<VitePlugin | VitePlugin[]> = [];
			for (const plugin of plugins) {
				if (plugin.hooks?.['build:before']) {
					let result = plugin.hooks['build:before']({ build, input });
					if (result.vitePlugin) {
						vitePlugins.push(result.vitePlugin);
					}
				}
			}

			return {
				vitePlugins,
				lastVitePlugins,
			};
		},

		async runPostHook(ssrReturn: ViteBuildReturn, clientReturn: ViteBuildReturn | null) {
			const mutations = new Map<
				string,
				{
					build: 'server' | 'client';
					code: string;
				}
			>();
			const ssrOutputs: RollupOutputArray = [];
			const clientOutputs: RollupOutputArray = [];

			if (Array.isArray(ssrReturn)) {
				ssrOutputs.push(...ssrReturn);
			} else if ('output' in ssrReturn) {
				ssrOutputs.push(ssrReturn);
			}

			if (Array.isArray(clientReturn)) {
				clientOutputs.push(...clientReturn);
			} else if (clientReturn && 'output' in clientReturn) {
				clientOutputs.push(clientReturn);
			}

			const mutate: MutateChunk = (chunk, build, newCode) => {
				chunk.code = newCode;
				mutations.set(chunk.fileName, {
					build,
					code: newCode,
				});
			};

			for (const plugin of allPlugins) {
				const postHook = plugin.hooks?.['build:post'];
				if (postHook) {
					await postHook({
						ssrOutputs,
						clientOutputs,
						mutate,
					});
				}
			}

			return mutations;
		},
	};
}

export type AstroBuildPluginContainer = ReturnType<typeof createPluginContainer>;
