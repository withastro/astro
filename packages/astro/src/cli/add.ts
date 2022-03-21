import type yargs from 'yargs-parser';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { resolveConfigURL } from '../core/config.js';
import { apply as applyPolyfill } from '../core/polyfill.js';
import { defaultLogOptions, error, info, debug, LogOptions, warn } from '../core/logger.js';
import * as msg from '../core/messages.js';
import { dim, red, cyan } from 'kleur/colors';
import { parseNpmName } from '../core/util.js';

export interface AddOptions {
	logging: LogOptions;
	cwd?: string;
	flags: yargs.Arguments;
}

const DEFAULT_CONFIG_STUB = `import { defineConfig } from 'astro/config';\n\nexport default defineConfig({});`;

export async function add(names: string[], { cwd, flags, logging }: AddOptions) {
	if (names.length === 0) {
		error(logging, null, `\n${red('No integration specified!')}\n${dim('Try using')} astro add ${cyan('[name]')}`);
		return;
	}
	const root = cwd ? path.resolve(cwd) : process.cwd();
	let configURL = await resolveConfigURL({ cwd, flags });
	applyPolyfill();
	if (configURL) {
		debug('add', `Found config at ${configURL}`);
	} else {
		info(logging, 'add', `Unable to locate a config file, generating one for you.`);
		configURL = new URL('./astro.config.mjs', `file://${root}/`);
		await fs.writeFile(fileURLToPath(configURL), DEFAULT_CONFIG_STUB, { encoding: 'utf-8' });
	}

	const integrations = await validateIntegrations(names);
	let ast = await parseAstroConfig(configURL);
	for (const integration of integrations) {
		ast = await addIntegration(ast, integration, { logging })
	}
	await updateAstroConfig(configURL, ast);
	
	const len = integrations.length;
	info(logging, null, msg.success(`Added ${len} integration${len === 1 ? '' : 's'} to your project.`, `Be sure to re-install your dependencies before continuing!`));
}

async function parseAstroConfig(configURL: URL) {
	const source = await fs.readFile(fileURLToPath(configURL)).then(res => res.toString());
	// TODO: parse source to AST
	// const source = serialize(ast);
	return source;
}

function addIntegration(ast: any, integration: IntegrationInfo, { logging }: { logging: LogOptions }) {
	// TODO: handle parsing astro config file, adding 
	return ast;
}

async function updateAstroConfig(configURL: URL, ast: any) {
	// TODO: serialize AST back to string;
	// const source = serialize(ast);
	// return await fs.writeFile(fileURLToPath(configURL), source, { encoding: 'utf-8' });
}

interface IntegrationInfo {
	id: string;
	packageName: string;
	dependencies: string[];
}

export async function validateIntegrations(integrations: string[]): Promise<IntegrationInfo[]> {
	const integrationEntries = await Promise.all(
		integrations.map((integration) => {
			const parsed = parseIntegrationName(integration);
			if (!parsed) {
				throw new Error(`${integration} does not appear to be a valid package name!`);
			}

			let { scope = '', name, tag } = parsed;
			// Allow third-party integrations starting with `astro-` namespace
			if (!name.startsWith('astro-')) {
				scope = `astrojs`;
			}
			const packageName = `${scope ? `@${scope}/` : ''}${name}`;
			return fetch(`https://registry.npmjs.org/${packageName}/${tag}`)
				.then((res) => {
					if (res.status === 404) {
						throw new Error(`Unable to fetch ${packageName}. Does this package exist?`);
					}
					return res.json();
				})
				.then((res: any) => {
					let dependencies: [string, string][] = [[res['name'], `^${res['version']}`]];

					if (res['peerDependencies']) {
						for (const peer in res['peerDependencies']) {
							dependencies.push([peer, res['peerDependencies'][peer]]);
						}
					}

					return { id: integration, packageName, dependencies: dependencies.flat(1) };
				});
		})
	);
	return integrationEntries;
}

function parseIntegrationName(spec: string) {
	const result = parseNpmName(spec);
	if (!result) return;
	let { scope, name } = result;
	let tag = 'latest';
	if (scope) {
		name = name.replace(scope + '/', '');
	}
	if (name.includes('@')) {
		const tagged = name.split('@');
		name = tagged[0];
		tag = tagged[1];
	}
	return { scope, name, tag };
}
