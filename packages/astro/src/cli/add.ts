/* eslint-disable no-console */
import type { AstroConfig, ManifestData, RouteCache, RouteData } from '../@types/astro';
import type { LogOptions } from '../core/logger';

import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import { promises as fs } from 'fs'
import { execa } from 'execa'
import { createRequire } from 'module'
import ni from '@antfu/ni'

export interface AddOptions {
	astroConfig: AstroConfig;
	logging: LogOptions;
}

const renderers = new Set([
	'lit',
	'preact',
	'react',
	'solid',
	'svelte',
	'vue'
])

export async function add(args: string[], opts: AddOptions) {
	const packages = [];
	const config: Partial<AstroConfig> = {};
	for (const name of args) {
		if (renderers.has(name)) {
			packages.push(`@astrojs/renderer-${name}`);
			config.renderers = [...(config.renderers || []), `@astrojs/renderer-${name}`];
		}
	}
	await install(packages, opts);
	await updateAstroUserConfig(config, opts);
}

async function updateAstroUserConfig(overrides: Partial<AstroConfig>, opts: AddOptions) {
	let userConfigPath = opts.astroConfig.__filePath ?? fileURLToPath(new URL('./astro.config.mjs', opts.astroConfig.projectRoot));
	console.log(overrides, userConfigPath);
}

let packageManager: 'npm'|'yarn'|'pnpm'|null = null;

async function install(packages: string[], opts: AddOptions) {
	const { astroConfig: { projectRoot }}  = opts;
	const cwd = fileURLToPath(projectRoot);
	packageManager = packageManager || await ni.detect({ autoInstall: false, cwd });

	if (!packageManager) {
		throw new Error(`Unable to detect default package manager!`);
	}

	const i = packageManager === 'yarn' ? 'add' : 'i';
	const dev = '-D';
	await execa(packageManager, [i, dev, ...packages], { cwd, stdio: 'inherit' });

	const localRequire = createRequire(pathToFileURL(cwd))
	let readPkgJSON = [];
	for (const pkg of packages) {
		const pkgJSON = path.join(path.dirname(localRequire.resolve(pkg)), 'package.json');
		readPkgJSON.push(fs.readFile(pkgJSON).then(res => JSON.parse(res.toString())));
	}
	const peerDependencies = (await Promise.all(readPkgJSON)).map(pkg => pkg.peerDependencies ? Object.keys(pkg.peerDependencies) : []).flat(Infinity);
	console.log(peerDependencies);
}
