import type yargs from 'yargs-parser';
import path from 'path';
import fs from 'fs/promises';
import { execaCommand } from 'execa';
import { fileURLToPath } from 'url';
import { diffWords } from 'diff';
import boxen from 'boxen';
import prompts from 'prompts';
import preferredPM from 'preferred-pm';
import ora from 'ora';
import { resolveConfigURL } from '../config.js';
import { apply as applyPolyfill } from '../polyfill.js';
import { error, info, debug, LogOptions } from '../logger.js';
import * as msg from '../messages.js';
import { dim, red, cyan, green, magenta, bold, reset } from 'kleur/colors';
import { parseNpmName } from '../util.js';
import { wrapDefaultExport } from './wrapper.js';
import { ensureImport } from './imports.js';
import { t, parse, visit, generate } from './babel.js';

export interface AddOptions {
	logging: LogOptions;
	cwd?: string;
	flags: yargs.Arguments;
}

export interface IntegrationInfo {
	id: string;
	packageName: string;
	dependencies: [name: string, version: string][];
}

const DEFAULT_FRAMEWORKS = [
	{ value: 'react', title: 'React' },
	{ value: 'preact', title: 'Preact' },
	{ value: 'vue', title: 'Vue' },
	{ value: 'svelte', title: 'Svelte' },
	{ value: 'solid-js', title: 'Solid' },
	{ value: 'lit', title: 'Lit' },
];
const DEFAULT_ADDONS = [
	{ value: 'tailwind', title: 'Tailwind' },
	{ value: 'turbolinks', title: 'Turbolinks' },
	{ value: 'partytown', title: 'Partytown' },
	{ value: 'sitemap', title: 'Sitemap' },
];

const ALIASES = new Map([
	['solid', 'solid-js'],
	['tailwindcss', 'tailwind'],
]);
const INSIGNIFICANT_CHARS = new Set([',', ']', '}']);

const DEFAULT_CONFIG_STUB = `import { defineConfig } from 'astro/config';\n\nexport default defineConfig({});`;

export default async function add(names: string[], { cwd, flags, logging }: AddOptions) {
	if (names.length === 0) {
		const response = await prompts([
			{
				type: 'multiselect',
				name: 'frameworks',
				message: 'What frameworks would you like to enable?',
				instructions: '\n  Space to select. Return to submit',
				choices: DEFAULT_FRAMEWORKS,
			},
			{
				type: 'multiselect',
				name: 'addons',
				message: 'What additional integrations would you like to enable?',
				instructions: '\n  Space to select. Return to submit',
				choices: DEFAULT_ADDONS,
			},
		]);

		if (!response.frameworks && !response.addons) {
			info(logging, null, msg.cancelled(`Integrations skipped.`, `You can always run ${cyan('astro add')} later!`));
			return;
		}
		const selected = [response.frameworks ?? [], response.addons ?? []].flat(1);
		if (selected.length === 0) {
			error(logging, null, `\n${red('No integrations specified!')}\n${dim('Try running')} astro add again.`);
			return;
		}
		names = selected;
	}

	// Some packages might have a common alias! We normalize those here.
	names = names.map((name) => (ALIASES.has(name) ? ALIASES.get(name)! : name));

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

	let configResult: UpdateResult | undefined;
	let installResult: UpdateResult | undefined;

	if (ast) {
		try {
			configResult = await updateAstroConfig({ configURL, ast, logging });
		} catch (err) {
			debug('add', 'Error updating astro config', err);
			error(logging, null, 'There has been an error updating the astro config. You might need to update it manually.');
			return;
		}
	}

	switch (configResult) {
		case UpdateResult.cancelled: {
			info(logging, null, msg.cancelled(`Your configuration has ${bold('NOT')} been updated.`));
			return;
		}
		case UpdateResult.none: {
			info(logging, null, msg.success(`Configuration up-to-date.`));
			break;
		}
	}

	installResult = await tryToInstallIntegrations({ integrations, cwd, logging });

	switch (installResult) {
		case UpdateResult.updated: {
			const len = integrations.length;
			if (integrations.find((integration) => integration.id === 'tailwind')) {
				const DEFAULT_TAILWIND_CONFIG = `module.exports = {
	content: [],
	theme: {
		extend: {},
	},
	plugins: [],
}\n`;
				await fs.writeFile(fileURLToPath(new URL('./tailwind.config.mjs', configURL)), DEFAULT_TAILWIND_CONFIG);
			}
			info(logging, null, msg.success(`Added ${len} integration${len === 1 ? '' : 's'} to your project`));
			return;
		}
		case UpdateResult.cancelled: {
			info(logging, null, msg.cancelled(`No dependencies installed.`, `Be sure to install them manually before continuing!`));
			return;
		}
		case UpdateResult.failure: {
			info(logging, null, msg.failure(`There was a problem installing dependencies.`, `Be sure to install them manually before continuing!`));
			process.exit(1);
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

const toIdent = (name: string) => {
	if (name.includes('-')) {
		return name.split('-')[0];
	}
	return name;
};

async function addIntegration(ast: t.File, integration: IntegrationInfo) {
	const integrationId = t.identifier(toIdent(integration.id));

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

			if (integrationsProp.value.type !== 'ArrayExpression') throw new Error('Unable to parse integrations');

			const existingIntegrationCall = integrationsProp.value.elements.find(
				(expr) => t.isCallExpression(expr) && t.isIdentifier(expr.callee) && expr.callee.name === integrationId.name
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

async function updateAstroConfig({ configURL, ast, logging }: { logging: LogOptions; configURL: URL; ast: t.File }): Promise<UpdateResult> {
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
		let lines = change.value
			.trim()
			.split('\n')
			.slice(0, change.count)
			.filter((x) => x && !INSIGNIFICANT_CHARS.has(x));
		if (lines.length === 0) continue;
		if (change.added) {
			if (INSIGNIFICANT_CHARS.has(change.value.trim())) continue;
			changes.push(change.value);
		}
	}
	let diffed = output;
	for (let newContent of changes) {
		const coloredOutput = newContent
			.split('\n')
			.map((ln) => (ln ? green(ln) : ''))
			.join('\n');
		diffed = diffed.replace(newContent, coloredOutput);
	}

	const message = `\n${boxen(diffed, { margin: 0.5, padding: 0.5, borderStyle: 'round', title: configURL.pathname.split('/').pop() })}\n`;

	info(logging, null, `\n  ${magenta('Astro will update your configuration with these changes...')}\n${message}`);

	const response = await prompts({
		type: 'confirm',
		name: 'updateConfig',
		message: 'Continue?',
		initial: true,
	});

	if (response.updateConfig) {
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
	dependencies: string;
}
async function getInstallIntegrationsCommand({ integrations, cwd = process.cwd() }: { integrations: IntegrationInfo[]; cwd?: string }): Promise<InstallCommand | null> {
	const pm = await preferredPM(cwd);
	debug('add', `package manager: ${JSON.stringify(pm)}`);
	if (!pm) return null;

	let dependencies = integrations
		.map<[string, string | null][]>((i) => [[i.packageName, null], ...i.dependencies])
		.flat(1)
		.filter((dep, i, arr) => arr.findIndex((d) => d[0] === dep[0]) === i)
		.map(([name, version]) => (version === null ? name : `${name}@${version}`))
		.sort()
		.join(' ');

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

async function tryToInstallIntegrations({ integrations, cwd, logging }: { integrations: IntegrationInfo[]; cwd?: string; logging: LogOptions }): Promise<UpdateResult> {
	const installCommand = await getInstallIntegrationsCommand({ integrations, cwd });

	if (installCommand === null) {
		info(logging, null);
		return UpdateResult.none;
	} else {
		const coloredOutput = `${cyan(`${installCommand.pm} ${installCommand.command} ${installCommand.flags.join(' ')}`)} ${installCommand.dependencies}`;
		const message = `\n${boxen(coloredOutput, { margin: 0.5, padding: 0.5, borderStyle: 'round' })}\n`;
		info(
			logging,
			null,
			`\n  ${magenta('Astro will run the following command to install...')}\n  ${dim('If you skip this step, you can always run it yourself later')}\n${message}`
		);
		const response = await prompts({
			type: 'confirm',
			name: 'installDependencies',
			message: 'Continue?',
			initial: true,
		});

		if (response.installDependencies) {
			const spinner = ora('Installing dependencies...').start();
			try {
				await execaCommand(`${installCommand.pm} ${installCommand.command} ${installCommand.flags} ${installCommand.dependencies}`, { cwd });
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

			let dependencies: IntegrationInfo['dependencies'] = [[result['name'], `^${result['version']}`]];

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
