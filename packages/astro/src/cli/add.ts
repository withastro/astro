import type yargs from 'yargs-parser';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { diffLines } from 'diff';
import prompts from 'prompts';
import { resolveConfigURL } from '../core/config.js';
import { apply as applyPolyfill } from '../core/polyfill.js';
import { defaultLogOptions, error, info, debug, LogOptions, warn } from '../core/logger.js';
import * as msg from '../core/messages.js';
import { dim, red, cyan, green } from 'kleur/colors';
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

	// Add integrations to astro config
	// TODO: At the moment, nearly nothing throws an error. We need more errors!
	let ast: t.File | null = null;
	try {
		ast = await parseAstroConfig(configURL);

		debug('add', 'Parsed astro config');

		const defineConfig = t.identifier('defineConfig');
		ensureImport(ast, t.importDeclaration([t.importSpecifier(defineConfig, defineConfig)], t.stringLiteral('astro/config')));
		wrapDefaultExport(ast, defineConfig);

		debug('add', 'Astro config ensured `defineConfig`');

		for (const integration of integrations) {
			await addIntegration(ast, integration);
			debug('add', `Astro config added integration ${integration.id}`);
		}
	} catch (err) {
		debug('add', 'Error parsing/modifying astro config: ', err);
		info(
			logging,
			null,
			"Sorry, we couldn't update your configuration automatically. [INSERT HOW TO DO IT MANUALLY --- this link might help: https://next--astro-docs-2.netlify.app/en/guides/integrations-guide/]"
		);
	}

	if (ast) {
		try {
			await updateAstroConfig({ configURL, ast, logging });

			const len = integrations.length;
			info(logging, null, msg.success(`Added ${len} integration${len === 1 ? '' : 's'} to your project.`, `Be sure to re-install your dependencies before continuing!`));
		} catch (err) {
			debug('add', 'Error updating astro config', err);
			error(logging, null, 'There has been an error updating the astro config. You might need to update it manually.');
		}
	}
}

async function parseAstroConfig(configURL: URL): Promise<t.File> {
	const source = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	const result = parse(source);

	if (!result) throw new Error('Unknown error parsing astro config');
	if (result.errors.length > 0) throw new Error('Error parsing astro config: ' + JSON.stringify(result.errors));

	return result;
}

async function addIntegration(ast: t.File, integration: IntegrationInfo) {
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

async function updateAstroConfig({ configURL, ast, logging }: { logging: LogOptions; configURL: URL; ast: t.File }) {
	const input = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	const output = await generate(ast, fileURLToPath(configURL));
	info(
		logging,
		null,
		diffLines(input, output)
			.map((change) => {
				let lines = change.value.split('\n').slice(0, -1); // remove latest \n

				if (change.added) lines = lines.map((line) => green(`+ ${line}`));
				else if (change.removed) lines = lines.map((line) => red(`- ${line}`));
				else lines = lines.map((line) => `  ${line}`);

				return lines.join('\n');
			})
			.join('\n')
	);

	const response = await prompts({
		type: 'confirm',
		name: 'updateConfig',
		message: 'This changes will be made to your configuration. Continue?',
		initial: true,
	});

	if (response.updateConfig) {
		await fs.writeFile(fileURLToPath(configURL), output, { encoding: 'utf-8' });
		debug('add', `Updated astro config`);
	} else {
		info(logging, null, 'No changes were made to the configuration file.');
	}
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
