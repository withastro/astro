import { parse as parseMetadata } from '@orgajs/metadata';
import orga from '@orgajs/rollup';
import { addAstroFragment } from './plugin/recma-add-astro-fragment.js';

type AstroIntegration = any;
type ContentEntryType = any;
type HookParameters = any;

type SetupHookParams = HookParameters & {
	addPageExtension: (extension: string) => void;
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

export function getContainerRenderer() {
	return {
		name: 'astro:jsx',
		serverEntrypoint: '@astrojs/org-mode/server.js',
	};
}

export default function orgMode(
	input: ({ recmaPlugins?: any[] } & Record<string, any>) | null = {},
): AstroIntegration {
	const { recmaPlugins, ...options } = input ?? {};

	return {
		name: '@astrojs/org-mode',
		hooks: {
			'astro:config:setup': async (params: HookParameters) => {
				const { addPageExtension, addContentEntryType, updateConfig, addRenderer } =
					params as SetupHookParams;

				addPageExtension('.org');
				addRenderer({
					name: 'astro:jsx',
					serverEntrypoint: new URL('../dist/server.js', import.meta.url),
				});

				addContentEntryType({
					extensions: ['.org'],
					async getEntryInfo({ contents }: { contents: string }) {
						const data = parseMetadata(contents);

						return {
							data,
							body: contents,
							rawData: JSON.stringify(data),
							slug: Array.isArray(data.slug) ? data.slug[0] : data.slug,
						};
					},
					handlePropagation: true,
				});

				updateConfig({
					vite: {
						plugins: [
							{
								enforce: 'pre',
								...orga({
									...options,
									jsxImportSource: 'astro',
									elementAttributeNameCase: 'html',
									development: false,
									recmaPlugins: [...(recmaPlugins ?? []), addAstroFragment],
								}),
								configResolved(resolved: any) {
									const jsxPluginIndex = resolved.plugins.findIndex(
										(plugin: any) => plugin.name === 'astro:jsx',
									);
									if (jsxPluginIndex === -1) return;

									const orgPluginIndex = resolved.plugins.findIndex(
										(plugin: any) => plugin.name === '@orgajs/rollup',
									);
									if (orgPluginIndex === -1) return;

									const orgPlugin = resolved.plugins[orgPluginIndex];
									resolved.plugins.splice(orgPluginIndex, 1);
									resolved.plugins.splice(jsxPluginIndex, 0, orgPlugin);
								},
							},
						],
					},
				});
			},
		},
	};
}
