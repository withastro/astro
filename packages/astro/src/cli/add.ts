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
import { t, parse, visit, ensureImport, wrapDefaultExport, generate } from '../transform/index.js';

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

	const defineConfig = t.identifier('defineConfig');
	ensureImport(ast, t.importDeclaration([t.importSpecifier(defineConfig, defineConfig)], t.stringLiteral('astro/config')));
	wrapDefaultExport(ast, defineConfig);

	for (const integration of integrations) {
		await addIntegration(ast, integration, { logging });
	}

	await updateAstroConfig(configURL, ast);

	const len = integrations.length;
	info(logging, null, msg.success(`Added ${len} integration${len === 1 ? '' : 's'} to your project.`, `Be sure to re-install your dependencies before continuing!`));
}

async function parseAstroConfig(configURL: URL): Promise<t.Program> {
	const source = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	const result = parse(source, { sourceType: 'unambiguous', plugins: ['typescript'] });

	if (!result) throw new Error('Unknown error parsing astro config');
	if (result.errors.length > 0) throw new Error('Error parsing astro config: ' + JSON.stringify(result.errors));

	return result.program;
}

async function addIntegration(ast: t.Program, integration: IntegrationInfo, { logging }: { logging: LogOptions }) {
	const integrationId = t.identifier(integration.id);

	ensureImport(ast, t.importDeclaration([t.importDefaultSpecifier(integrationId)], t.stringLiteral(integration.packageName)));

	visit(ast, {
		// eslint-disable-next-line @typescript-eslint/no-shadow
		ExportDefaultDeclaration(path) {
			if (!t.isCallExpression(path.node.declaration)) return;

			const configObject = path.node.declaration.arguments[0];
			if (!t.isObjectExpression(configObject)) return;

			let integrationsProp = configObject.properties.find((prop) => {
				if (prop.type !== 'ObjectProperty') return false;
				if (prop.key.type === 'Identifier') {
					if (prop.key.name === 'integrations') return true;
				}
				if (prop.key.type === 'StringLiteral') {
					if (prop.key.value === 'integrations') return true;
				}
				return false;
			}) as t.ObjectProperty | undefined;

			const integrationCall = t.callExpression(integrationId, []);

			if (!integrationsProp) {
				configObject.properties.push(t.objectProperty(t.identifier('integrations'), t.arrayExpression([integrationCall])));
				return;
			}

			if (integrationsProp.value.type !== 'ArrayExpression') return;

			integrationsProp.value.elements.push(integrationCall);
		},
	});
}

async function updateAstroConfig(configURL: URL, ast: t.Program) {
	const source = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	const output = generate(ast, {}, source);
	await fs.writeFile(fileURLToPath(configURL), output.code, { encoding: 'utf-8' });
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
