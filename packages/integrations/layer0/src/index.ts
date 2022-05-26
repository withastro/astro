import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import { promises as fsp } from 'fs';
import fse from 'fs-extra';
import { chdir } from 'process';
import { resolve, dirname, join } from 'pathe';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import templates from './templates.js';
import type { PackageJson } from 'pkg-types';

const LAYER0_DEPS = ['@layer0/cli@latest', '@layer0/core@latest', 'kleur@4.1.4', 'mime@3.0.0'];

let layer0Dir: string;
let outputDir: string;

interface Options {
	port?: number;
}

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/layer0',
		serverEntrypoint: '@astrojs/node/server.js',
		exports: ['handler'],
	};
}

export default function layer0(): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/layer0',
		hooks: {
			'astro:config:setup': ({ config }) => {
				console.log('config', config);
				config.outDir = new URL('.output/', config.root);
				config.build.format = 'directory';
			},

			'astro:config:done': async ({ config, setAdapter }) => {
				_config = config;
				setAdapter(getAdapter());
			},

			'astro:build:done': async () => {
				layer0Dir = fileURLToPath(new URL('./layer0/', _config.outDir));
				outputDir = fileURLToPath(_config.outDir);
				const packageJsonPath = fileURLToPath(new URL('./package.json', _config.root));

				// Write Layer0 config, router, and connector files
				for (let { path, template } of templates) {
					await writeFile(join(outputDir, path), template);
				}

				// copy package.json from the project root and modify it for Layer0 dependencies
				const pkgJSON: PackageJson & { scripts: Record<string, string> } = await fse.readJSON(
					packageJsonPath
				);

				pkgJSON.scripts = {
					build: '0 build',
					deploy: '0 deploy',
					preview: '0 run -p',
				};

				await writeFile(resolve(outputDir, 'package.json'), JSON.stringify(pkgJSON, null, 2));

				// create an empty workspace file so the node_modules are installed locally to the output
				await writeFile(resolve(outputDir, 'pnpm-workspace.yaml'), '');

				await installLayer0Deps();
				await runLayer0Cmd('build');
			},
		},
	};
}

async function writeFile(path: string, contents: string) {
	await fsp.mkdir(dirname(path), { recursive: true });
	await fsp.writeFile(path, contents, 'utf-8');
}

async function installLayer0Deps() {
	chdir(outputDir);
	await execa('pnpm', ['--ignore-workspace-root-check', 'add', ...LAYER0_DEPS], {
		shell: true,
		stdio: 'inherit',
	});
}

async function runLayer0Cmd(cmd: string) {
	chdir(outputDir);
	await execa(`pnpm`, ['run', cmd], {
		shell: true,
		stdio: 'inherit',
	});
}
