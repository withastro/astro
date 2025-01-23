import type { AstroIntegration } from 'astro';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

type TailwindOptions = {
	/**
	 * Path to your tailwind config file
	 * @deprecated It is recommended to use the `@config` directive, see https://tailwindcss.com/docs/upgrade-guide#using-a-javascript-config-file
	 * @default './tailwind.config.mjs'
	 */
	configFile?: string;
	/**
	 * Apply Tailwind's base styles
	 * @deprecated It is recommended to use a css file to configure Tailwind, see https://tailwindcss.com/docs/upgrade-guide#removed-tailwind-directives
	 * @default true
	 */
	applyBaseStyles?: boolean;
};

export default function tailwindIntegration({
	applyBaseStyles = true,
	configFile,
}: TailwindOptions = {}): AstroIntegration {
	if (applyBaseStyles && !configFile) {
		configFile = './tailwind.config.mjs';
	}

	return {
		name: '@astrojs/tailwind',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, injectScript, createCodegenDir }) => {
				updateConfig({
					vite: { plugins: [tailwindcss()] },
				});

				if (applyBaseStyles) {
					const codegenDir = createCodegenDir();
					let content = '@import "tailwindcss";';
					if (configFile) {
						content += `\n@config ${JSON.stringify(fileURLToPath(new URL(configFile, config.root)))};`;
					}

					const url = new URL('tailwind.css', codegenDir);
					writeFileSync(url, content, 'utf-8');

					injectScript('page-ssr', `import ${JSON.stringify(url)};`);
				}
			},
		},
	};
}
