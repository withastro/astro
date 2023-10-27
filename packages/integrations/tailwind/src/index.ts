import type { AstroIntegration } from 'astro';
import autoprefixerPlugin from 'autoprefixer';
import type { ResultPlugin } from 'postcss-load-config';
import tailwindPlugin from 'tailwindcss';
import type { CSSOptions, UserConfig } from 'vite';

async function getPostCssConfig(
	root: UserConfig['root'],
	postcssInlineOptions: CSSOptions['postcss']
) {
	let postcssConfigResult;
	// Check if postcss config is not inlined
	if (!(typeof postcssInlineOptions === 'object' && postcssInlineOptions !== null)) {
		let { default: postcssrc } = await import('postcss-load-config');
		const searchPath = typeof postcssInlineOptions === 'string' ? postcssInlineOptions : root!;
		try {
			postcssConfigResult = await postcssrc({}, searchPath);
		} catch (e) {
			postcssConfigResult = null;
		}
	}
	return postcssConfigResult;
}

async function getViteConfiguration(
	tailwindConfigPath: string | undefined,
	viteConfig: UserConfig
) {
	// We need to manually load postcss config files because when inlining the tailwind and autoprefixer plugins,
	// that causes vite to ignore postcss config files
	const postcssConfigResult = await getPostCssConfig(viteConfig.root, viteConfig.css?.postcss);

	const postcssOptions = postcssConfigResult?.options ?? {};
	const postcssPlugins = postcssConfigResult?.plugins?.slice() ?? [];

	// @ts-expect-error Tailwind plugin types are wrong
	postcssPlugins.push(tailwindPlugin(tailwindConfigPath) as ResultPlugin);
	postcssPlugins.push(autoprefixerPlugin());

	return {
		css: {
			postcss: {
				options: postcssOptions,
				plugins: postcssPlugins,
			},
		},
	};
}

type TailwindOptions = {
	/**
	 * Path to your tailwind config file
	 * @default 'tailwind.config.mjs'
	 */
	configFile?: string;
	/**
	 * Apply Tailwind's base styles
	 * Disabling this is useful when further customization of Tailwind styles
	 * and directives is required. See {@link https://tailwindcss.com/docs/functions-and-directives#tailwind Tailwind's docs}
	 * for more details on directives and customization.
	 * @default true
	 */
	applyBaseStyles?: boolean;
};

export default function tailwindIntegration(options?: TailwindOptions): AstroIntegration {
	const applyBaseStyles = options?.applyBaseStyles ?? true;
	const customConfigPath = options?.configFile;
	return {
		name: '@astrojs/tailwind',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, injectScript }) => {
				// Inject the Tailwind postcss plugin
				updateConfig({
					vite: await getViteConfiguration(customConfigPath, config.vite),
				});

				if (applyBaseStyles) {
					// Inject the Tailwind base import
					injectScript('page-ssr', `import '@astrojs/tailwind/base.css';`);
				}
			},
		},
	};
}
