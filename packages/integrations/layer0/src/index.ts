import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import { promises as fsp } from 'fs';
import { chdir, cwd } from 'process';
import { resolve, dirname } from 'pathe';
import { fileURLToPath } from 'url';
import { execa, execaCommand } from 'execa';
import type { PackageJson } from 'pkg-types';

const LAYER0_CMD = 'npx @layer0/cli';
const LAYER0_DEPS = ['@layer0/cli@latest', '@layer0/core@latest'];
const EXEC_OPTS = {
	shell: true,
	stdio: 'inherit',
};
let layer0Dir: string;
let outputDir: string;

interface Options {
	port?: number;
}

export function getAdapter(args?: Options): AstroAdapter {
	return {
		name: '@astrojs/layer0',
		serverEntrypoint: '@astrojs/layer0/server.js',
		args: args ?? {},
		exports: ['stop', 'handle', 'start', 'running'],
	};
}

export default function layer0(): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/layer0',
		hooks: {
			'astro:config:setup': ({ config }) => {
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

				const configPath = resolve(outputDir, 'layer0.config.js');
				await writeFile(configPath, `module.exports = ${JSON.stringify(layer0Config, null, 2)}`);

				const routerPath = resolve(outputDir, 'routes.js');
				await writeFile(routerPath, routesTemplate());

				const entryPath = resolve(layer0Dir, 'prod.js');
				await writeFile(entryPath, entryTemplate());

				const pkgJSON: PackageJson & { scripts: Record<string, string> } = {
					private: true,
					scripts: {
						build: '0 build',
						deploy: '0 deploy',
						preview: '0 build && 0 run -p',
					},
				};
				await writeFile(resolve(outputDir, 'package.json'), JSON.stringify(pkgJSON, null, 2));
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

// Layer0 router (routes.js)
function routesTemplate() {
	return `
import { Router } from '@layer0/core';

const TIME_1H = 60 * 60;
const TIME_4H = TIME_1H * 4;
const TIME_1D = TIME_1H * 24;

const CACHE_ASSETS = {
	edge: {
		maxAgeSeconds: TIME_1D,
		forcePrivateCaching: true,
		staleWhileRevalidateSeconds: TIME_1H,
	},
	browser: {
		maxAgeSeconds: 0,
		serviceWorkerSeconds: TIME_1D,
		spa: true,
	},
};

export default new Router().math('/:path*', ({ cache, serveStatic, renderWithApp }) => {
	cache(CACHE_ASSETS);
	serveStatic('client/:path*', {
		onNotFound: () => renderWithApp,
	});
	renderWithApp();
});
`.trim();
}

// Layer0 entrypoint (layer0/prod.js)
function entryTemplate() {
	return `
const http = require('http')
module.exports = async function prod(port) {
  const { handler } = await import('../server/index.mjs')
  const server = http.createServer(handler)
  server.listen(port)
}
  `.trim();
}

async function installLayer0Deps() {
	chdir(outputDir);
	await execa('pnpm', ['--ignore-workspace-root-check', 'add', ...LAYER0_DEPS], EXEC_OPTS);
}

async function runLayer0Cmd(cmd: string) {
	chdir(outputDir);
	await execa(`pnpm`, ['run', cmd], EXEC_OPTS);
}
