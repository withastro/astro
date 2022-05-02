import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import { promises as fsp } from 'fs';
import { resolve, dirname } from 'pathe';
import { fileURLToPath } from 'url';

import type { PackageJson } from 'pkg-types';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/layer0',
		serverEntrypoint: '@astrojs/layer0/prod.js',
		exports: ['handler'],
	};
}

export default function layer0(): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/layer0',
		hooks: {
			'astro:config:setup': async ({ config }: { config: AstroConfig }) => {
				config.outDir = new URL('./layer0/', config.root);

				// Write Layer0 config, router, and connector files
				const layer0Config = {
					connector: './layer0',
					name: 'astro-app',
					routes: 'routes.js',
					backends: {},
					includeFiles: {
						'public/**/*': true,
						'server/**/*': true,
					},
				};

				console.log('config', config);
				const configPath = resolve(fileURLToPath(config.outDir), 'layer0.config.js');
				await writeFile(configPath, `module.exports = ${JSON.stringify(layer0Config, null, 2)}`);

				const routerPath = resolve(fileURLToPath(config.outDir), 'routes.js');
				await writeFile(routerPath, routesTemplate());

				const pkgJSON: PackageJson & { scripts: Record<string, string> } = {
					private: true,
					scripts: {
						deploy: '0 deploy',
						preview: '0 build && 0 run -p',
					},
					devDependencies: {
						'@layer0/cli': '^4.13.2',
						'@layer0/core': '^4.13.2',
					},
				};
				await writeFile(
					resolve(fileURLToPath(config.outDir), 'package.json'),
					JSON.stringify(pkgJSON, null, 2)
				);
			},
			'astro:config:done': ({ setAdapter }) => {
				setAdapter(getAdapter());
				// run layer0 init?
			},
		},
	};
}

async function writeFile(path: string, contents: string) {
	await fsp.mkdir(dirname(path), { recursive: true });
	await fsp.writeFile(path, contents, 'utf-8');
}

// Layer0 router (routes.js)
function routesTemplate() {
	return `
import { Router } from '@layer0/core'

const router = new Router()
export default router

router.fallback(({ renderWithApp }) => {
  renderWithApp()
})
`.trim();
}
