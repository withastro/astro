import type { AstroTelemetry } from '@astrojs/telemetry';
import boxen from 'boxen';
import { diffWords } from 'diff';
import { execa } from 'execa';
import { existsSync, promises as fs } from 'fs';
import { bold, cyan, dim, green, magenta } from 'kleur/colors';
import ora from 'ora';
import path from 'path';
import preferredPM from 'preferred-pm';
import prompts from 'prompts';
import { fileURLToPath, pathToFileURL } from 'url';
import type yargs from 'yargs-parser';
import { resolveConfigURL } from '../config.js';
import { debug, info, LogOptions } from '../logger/core.js';
import * as msg from '../messages.js';
import { printHelp } from '../messages.js';
import { appendForwardSlash } from '../path.js';
import { apply as applyPolyfill } from '../polyfill.js';
import { parseNpmName } from '../util.js';
import { generate, parse, t, visit } from './babel.js';
import { ensureImport } from './imports.js';
import { wrapDefaultExport } from './wrapper.js';

export interface AddOptions {
	logging: LogOptions;
	flags: yargs.Arguments;
	telemetry: AstroTelemetry;
	cwd?: string;
}

export interface IntegrationInfo {
	id: string;
	packageName: string;
	dependencies: [name: string, version: string][];
}
const ALIASES = new Map([
	['solid', 'solid-js'],
	['tailwindcss', 'tailwind'],
]);
const ASTRO_CONFIG_STUB = `import { defineConfig } from 'astro/config';\n\ndefault defineConfig({});`;
const TAILWIND_CONFIG_STUB = `/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [],
}\n`;

export default async function add(names: string[], { cwd, flags, logging, telemetry }: AddOptions) {
	if (flags.help || names.length === 0) {
		printHelp({
			commandName: 'astro add',
			usage: '[...integrations]',
			tables: {
				Flags: [
					['--yes', 'Accept all prompts.'],
					['--help', 'Show this help message.'],
				],
				'Example: Add a UI Framework': [
					['react', 'astro add react'],
					['preact', 'astro add preact'],
					['vue', 'astro add vue'],
					['svelte', 'astro add svelte'],
					['solid-js', 'astro add solid-js'],
					['lit', 'astro add lit'],
				],
				'Example: Add an Integration': [
					['tailwind', 'astro add tailwind'],
					['partytown', 'astro add partytown'],
					['sitemap', 'astro add sitemap'],
				],
			},
			description: `Check out the full integration catalog: ${cyan(
				'https://astro.build/integrations'
			)}`,
		});
		return;
	}
	let configURL: URL | undefined;
	const root = pathToFileURL(cwd ? path.resolve(cwd) : process.cwd());
	configURL = await resolveConfigURL({ cwd, flags });
	applyPolyfill();

	if (configURL) {
		debug('add', `Found config at ${configURL}`);
	} else {
		info(logging, 'add', `Unable to locate a config file, generating one for you.`);
		configURL = new URL('./astro.config.mjs', appendForwardSlash(root.href));
		await fs.writeFile(fileURLToPath(configURL), ASTRO_CONFIG_STUB, { encoding: 'utf-8' });
	}

	// TODO: improve error handling for invalid configs
	if (configURL?.pathname.endsWith('package.json')) {
		throw new Error(
			`Unable to use "astro add" with package.json configuration. Try migrating to \`astro.config.mjs\` and try again.`
		);
	}

	// Some packages might have a common alias! We normalize those here.
	const integrationNames = names.map((name) => (ALIASES.has(name) ? ALIASES.get(name)! : name));
	const integrations = await validateIntegrations(integrationNames);

	let ast: t.File | null = null;
	try {
		ast = await parseAstroConfig(configURL);

		debug('add', 'Parsed astro config');

		const defineConfig = t.identifier('defineConfig');
		ensureImport(
			ast,
			t.importDeclaration(
				[t.importSpecifier(defineConfig, defineConfig)],
				t.stringLiteral('astro/config')
			)
		);
		wrapDefaultExport(ast, defineConfig);

		debug('add', 'Astro config ensured `defineConfig`');

		for (const integration of integrations) {
			await addIntegration(ast, integration);
			debug('add', `Astro config added integration ${integration.id}`);
		}
	} catch (err) {
		debug('add', 'Error parsing/modifying astro config: ', err);
		throw createPrettyError(err as Error);
	}

	let configResult: UpdateResult | undefined;
	let installResult: UpdateResult | undefined;

	if (ast) {
		try {
			configResult = await updateAstroConfig({ configURL, ast, flags, logging });
		} catch (err) {
			debug('add', 'Error updating astro config', err);
			throw createPrettyError(err as Error);
		}
	}

	switch (configResult) {
		case UpdateResult.cancelled: {
			info(logging, null, msg.cancelled(`Your configuration has ${bold('NOT')} been updated.`));
			return;
		}
		case UpdateResult.none: {
			const pkgURL = new URL('./package.json', configURL);
			if (existsSync(fileURLToPath(pkgURL))) {
				const { dependencies = {}, devDependencies = {} } = await fs
					.readFile(fileURLToPath(pkgURL))
					.then((res) => JSON.parse(res.toString()));
				const deps = Object.keys(Object.assign(dependencies, devDependencies));
				const missingDeps = integrations.filter(
					(integration) => !deps.includes(integration.packageName)
				);
				if (missingDeps.length === 0) {
					info(logging, null, msg.success(`Configuration up-to-date.`));
					return;
				}
			}

			info(logging, null, msg.success(`Configuration up-to-date.`));
			break;
		}
	}

	installResult = await tryToInstallIntegrations({ integrations, cwd, flags, logging });

	switch (installResult) {
		case UpdateResult.updated: {
			const len = integrations.length;
			if (integrations.find((integration) => integration.id === 'tailwind')) {
				const possibleConfigFiles = [
					'./tailwind.config.cjs',
					'./tailwind.config.mjs',
					'./tailwind.config.js',
				].map((p) => fileURLToPath(new URL(p, configURL)));
				let alreadyConfigured = false;
				for (const possibleConfigPath of possibleConfigFiles) {
					if (existsSync(possibleConfigPath)) {
						alreadyConfigured = true;
						break;
					}
				}
				if (!alreadyConfigured) {
					info(
						logging,
						null,
						`\n  ${magenta(
							`Astro will generate a minimal ${bold('./tailwind.config.cjs')} file.`
						)}\n`
					);
					if (await askToContinue({ flags })) {
						await fs.writeFile(
							fileURLToPath(new URL('./tailwind.config.cjs', configURL)),
							TAILWIND_CONFIG_STUB,
							{ encoding: 'utf-8' }
						);
						debug('add', `Generated default ./tailwind.config.cjs file`);
					}
				} else {
					debug('add', `Using existing Tailwind configuration`);
				}
			}
			const list = integrations.map((integration) => `  - ${integration.packageName}`).join('\n');
			info(
				logging,
				null,
				msg.success(
					`Added the following integration${len === 1 ? '' : 's'} to your project:\n${list}`
				)
			);
			return;
		}
		case UpdateResult.cancelled: {
			info(
				logging,
				null,
				msg.cancelled(
					`Dependencies ${bold('NOT')} installed.`,
					`Be sure to install them manually before continuing!`
				)
			);
			return;
		}
		case UpdateResult.failure: {
			throw createPrettyError(new Error(`Unable to install dependencies`));
		}
	}
}

async function parseAstroConfig(configURL: URL): Promise<t.File> {
	const source = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	const result = parse(source);

	if (!result) throw new Error('Unknown error parsing astro config');
	if (result.errors.length > 0)
		throw new Error('Error parsing astro config: ' + JSON.stringify(result.errors));

	return result;
}

const toIdent = (name: string) => {
	if (name.includes('-')) {
		return name.split('-')[0];
	}
	return name;
};

function createPrettyError(err: Error) {
	err.message = `Astro could not update your astro.config.js file safely.
Reason: ${err.message}

You will need to add these integration(s) manually.
Documentation: https://docs.astro.build/en/guides/integrations-guide/`;
	return err;
}

async function addIntegration(ast: t.File, integration: IntegrationInfo) {
	const integrationId = t.identifier(toIdent(integration.id));

	ensureImport(
		ast,
		t.importDeclaration(
			[t.importDefaultSpecifier(integrationId)],
			t.stringLiteral(integration.packageName)
		)
	);

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
				configObject.properties.push(
					t.objectProperty(t.identifier('integrations'), t.arrayExpression([integrationCall]))
				);
				return;
			}

			if (integrationsProp.value.type !== 'ArrayExpression')
				throw new Error('Unable to parse integrations');

			const existingIntegrationCall = integrationsProp.value.elements.find(
				(expr) =>
					t.isCallExpression(expr) &&
					t.isIdentifier(expr.callee) &&
					expr.callee.name === integrationId.name
			);

			if (existingIntegrationCall) return;

			integrationsProp.value.elements.push(integrationCall);
		},
	});
}

const enum UpdateResult {
	none,
	updated,
	cancelled,
	failure,
}

async function updateAstroConfig({
	configURL,
	ast,
	flags,
	logging,
}: {
	configURL: URL;
	ast: t.File;
	flags: yargs.Arguments;
	logging: LogOptions;
}): Promise<UpdateResult> {
	const input = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	let output = await generate(ast);
	const comment = '// https://astro.build/config';
	const defaultExport = 'export default defineConfig';
	output = output.replace(` ${comment}`, '');
	output = output.replace(`${defaultExport}`, `\n${comment}\n${defaultExport}`);

	if (input === output) {
		return UpdateResult.none;
	}

	let changes = [];
	for (const change of diffWords(input, output)) {
		let lines = change.value.trim().split('\n').slice(0, change.count);
		if (lines.length === 0) continue;
		if (change.added) {
			if (!change.value.trim()) continue;
			changes.push(change.value);
		}
	}
	if (changes.length === 0) {
		return UpdateResult.none;
	}

	let diffed = output;
	for (let newContent of changes) {
		const coloredOutput = newContent
			.split('\n')
			.map((ln) => (ln ? green(ln) : ''))
			.join('\n');
		diffed = diffed.replace(newContent, coloredOutput);
	}

	const message = `\n${boxen(diffed, {
		margin: 0.5,
		padding: 0.5,
		borderStyle: 'round',
		title: configURL.pathname.split('/').pop(),
	})}\n`;

	info(
		logging,
		null,
		`\n  ${magenta('Astro will make the following changes to your config file:')}\n${message}`
	);

	if (await askToContinue({ flags })) {
		await fs.writeFile(fileURLToPath(configURL), output, { encoding: 'utf-8' });
		debug('add', `Updated astro config`);
		return UpdateResult.updated;
	} else {
		return UpdateResult.cancelled;
	}
}

interface InstallCommand {
	pm: string;
	command: string;
	flags: string[];
	dependencies: string[];
}
async function getInstallIntegrationsCommand({
	integrations,
	cwd = process.cwd(),
}: {
	integrations: IntegrationInfo[];
	cwd?: string;
}): Promise<InstallCommand | null> {
	const pm = await preferredPM(cwd);
	debug('add', `package manager: ${JSON.stringify(pm)}`);
	if (!pm) return null;

	let dependencies = integrations
		.map<[string, string | null][]>((i) => [[i.packageName, null], ...i.dependencies])
		.flat(1)
		.filter((dep, i, arr) => arr.findIndex((d) => d[0] === dep[0]) === i)
		.map(([name, version]) =>
			version === null ? name : `${name}@${version.split(/\s*\|\|\s*/).pop()}`
		)
		.sort();

	switch (pm.name) {
		case 'npm':
			return { pm: 'npm', command: 'install', flags: ['--save-dev'], dependencies };
		case 'yarn':
			return { pm: 'yarn', command: 'add', flags: ['--dev'], dependencies };
		case 'pnpm':
			return { pm: 'pnpm', command: 'install', flags: ['--save-dev'], dependencies };
		default:
			return null;
	}
}

async function tryToInstallIntegrations({
	integrations,
	cwd,
	flags,
	logging,
}: {
	integrations: IntegrationInfo[];
	cwd?: string;
	flags: yargs.Arguments;
	logging: LogOptions;
}): Promise<UpdateResult> {
	const installCommand = await getInstallIntegrationsCommand({ integrations, cwd });

	if (installCommand === null) {
		info(logging, null);
		return UpdateResult.none;
	} else {
		const coloredOutput = `${bold(installCommand.pm)} ${
			installCommand.command
		} ${installCommand.flags.join(' ')} ${cyan(installCommand.dependencies.join(' '))}`;
		const message = `\n${boxen(coloredOutput, {
			margin: 0.5,
			padding: 0.5,
			borderStyle: 'round',
		})}\n`;
		info(
			logging,
			null,
			`\n  ${magenta('Astro will run the following command:')}\n  ${dim(
				'If you skip this step, you can always run it yourself later'
			)}\n${message}`
		);

		if (await askToContinue({ flags })) {
			const spinner = ora('Installing dependencies...').start();
			try {
				await execa(
					installCommand.pm,
					[installCommand.command, ...installCommand.flags, ...installCommand.dependencies],
					{ cwd }
				);
				spinner.succeed();
				return UpdateResult.updated;
			} catch (err) {
				debug('add', 'Error installing dependencies', err);
				spinner.fail();
				return UpdateResult.failure;
			}
		} else {
			return UpdateResult.cancelled;
		}
	}
}

export async function validateIntegrations(integrations: string[]): Promise<IntegrationInfo[]> {
	const spinner = ora('Resolving integrations...').start();
	const integrationEntries = await Promise.all(
		integrations.map(async (integration): Promise<IntegrationInfo> => {
			const parsed = parseIntegrationName(integration);
			if (!parsed) {
				spinner.fail();
				throw new Error(`${integration} does not appear to be a valid package name!`);
			}

			let { scope = '', name, tag } = parsed;
			// Allow third-party integrations starting with `astro-` namespace
			if (!name.startsWith('astro-')) {
				scope = `astrojs`;
			}
			const packageName = `${scope ? `@${scope}/` : ''}${name}`;

			const result = await fetch(`https://registry.npmjs.org/${packageName}/${tag}`).then((res) => {
				if (res.status === 404) {
					spinner.fail();
					throw new Error(`Unable to fetch ${packageName}. Does this package exist?`);
				}
				return res.json();
			});

			let dependencies: IntegrationInfo['dependencies'] = [
				[result['name'], `^${result['version']}`],
			];

			if (result['peerDependencies']) {
				for (const peer in result['peerDependencies']) {
					dependencies.push([peer, result['peerDependencies'][peer]]);
				}
			}

			return { id: integration, packageName, dependencies };
		})
	);
	spinner.succeed();
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

async function askToContinue({ flags }: { flags: yargs.Arguments }): Promise<boolean> {
	if (flags.yes) return true;

	const response = await prompts({
		type: 'confirm',
		name: 'askToContinue',
		message: 'Continue?',
		initial: true,
	});

	return Boolean(response.askToContinue);
}
