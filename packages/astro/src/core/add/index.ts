import type { AstroTelemetry } from '@astrojs/telemetry';
import boxen from 'boxen';
import { diffWords } from 'diff';
import { execa } from 'execa';
import { existsSync, promises as fs } from 'fs';
import { bold, cyan, dim, green, magenta, yellow } from 'kleur/colors';
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
	type: 'integration' | 'adapter';
}
const ALIASES = new Map([
	['solid', 'solid-js'],
	['tailwindcss', 'tailwind'],
]);
const ASTRO_CONFIG_STUB = `import { defineConfig } from 'astro/config';\n\nexport default defineConfig({});`;
const TAILWIND_CONFIG_STUB = `/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [],
}\n`;

const OFFICIAL_ADAPTER_TO_IMPORT_MAP: Record<string, string> = {
	netlify: '@astrojs/netlify/functions',
	vercel: '@astrojs/vercel/serverless',
	cloudflare: '@astrojs/cloudflare',
	node: '@astrojs/node',
	deno: '@astrojs/deno',
};

export default async function add(names: string[], { cwd, flags, logging, telemetry }: AddOptions) {
	if (flags.help || names.length === 0) {
		printHelp({
			commandName: 'astro add',
			usage: '[...integrations] [...adapters]',
			tables: {
				Flags: [
					['--yes', 'Accept all prompts.'],
					['--help', 'Show this help message.'],
				],
				'Recommended: UI Frameworks': [
					['react', 'astro add react'],
					['preact', 'astro add preact'],
					['vue', 'astro add vue'],
					['svelte', 'astro add svelte'],
					['solid-js', 'astro add solid-js'],
					['lit', 'astro add lit'],
				],
				'Recommended: Hosting': [
					['netlify', 'astro add netlify'],
					['vercel', 'astro add vercel'],
					['cloudflare', 'astro add cloudflare'],
					['deno', 'astro add deno'],
				],
				'Recommended: Integrations': [
					['tailwind', 'astro add tailwind'],
					['partytown', 'astro add partytown'],
					['sitemap', 'astro add sitemap'],
				],
				'Example: Add an Adapter': [
					['netlify', 'astro add netlify'],
					['vercel', 'astro add vercel'],
					['deno', 'astro add deno'],
				],
			},
			description: `For more integrations, check out: ${cyan('https://astro.build/integrations')}`,
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
			if (isAdapter(integration)) {
				const officialExportName = OFFICIAL_ADAPTER_TO_IMPORT_MAP[integration.id];
				if (officialExportName) {
					await setAdapter(ast, integration, officialExportName);
				} else {
					info(
						logging,
						null,
						`\n  ${magenta(
							`Check our deployment docs for ${bold(
								integration.packageName
							)} to update your "adapter" config.`
						)}`
					);
				}
			} else {
				await addIntegration(ast, integration);
			}
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
			configResult = await updateAstroConfig({
				configURL,
				ast,
				flags,
				logging,
				logAdapterInstructions: integrations.some(isAdapter),
			});
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

function isAdapter(
	integration: IntegrationInfo
): integration is IntegrationInfo & { type: 'adapter' } {
	return integration.type === 'adapter';
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

async function setAdapter(ast: t.File, adapter: IntegrationInfo, exportName: string) {
	const adapterId = t.identifier(toIdent(adapter.id));

	ensureImport(
		ast,
		t.importDeclaration([t.importDefaultSpecifier(adapterId)], t.stringLiteral(exportName))
	);

	visit(ast, {
		// eslint-disable-next-line @typescript-eslint/no-shadow
		ExportDefaultDeclaration(path) {
			if (!t.isCallExpression(path.node.declaration)) return;

			const configObject = path.node.declaration.arguments[0];
			if (!t.isObjectExpression(configObject)) return;

			let adapterProp = configObject.properties.find((prop) => {
				if (prop.type !== 'ObjectProperty') return false;
				if (prop.key.type === 'Identifier') {
					if (prop.key.name === 'adapter') return true;
				}
				if (prop.key.type === 'StringLiteral') {
					if (prop.key.value === 'adapter') return true;
				}
				return false;
			}) as t.ObjectProperty | undefined;

			const adapterCall = t.callExpression(adapterId, []);

			if (!adapterProp) {
				configObject.properties.push(t.objectProperty(t.identifier('adapter'), adapterCall));
				return;
			}

			adapterProp.value = adapterCall;
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
	logAdapterInstructions,
}: {
	configURL: URL;
	ast: t.File;
	flags: yargs.Arguments;
	logging: LogOptions;
	logAdapterInstructions: boolean;
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

	if (logAdapterInstructions) {
		info(
			logging,
			null,
			magenta(
				`  For complete deployment options, visit\n  ${bold(
					'https://docs.astro.build/en/guides/deploy/'
				)}\n`
			)
		);
	}

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

async function fetchPackageJson(
	scope: string | undefined,
	name: string,
	tag: string
): Promise<object | Error> {
	const packageName = `${scope ? `@${scope}/` : ''}${name}`;
	const res = await fetch(`https://registry.npmjs.org/${packageName}/${tag}`);
	if (res.status === 404) {
		return new Error();
	} else {
		return await res.json();
	}
}

export async function validateIntegrations(integrations: string[]): Promise<IntegrationInfo[]> {
	const spinner = ora('Resolving packages...').start();
	try {
		const integrationEntries = await Promise.all(
			integrations.map(async (integration): Promise<IntegrationInfo> => {
				const parsed = parseIntegrationName(integration);
				if (!parsed) {
					throw new Error(`${bold(integration)} does not appear to be a valid package name!`);
				}

				let { scope, name, tag } = parsed;
				let pkgJson = null;
				let pkgType: 'first-party' | 'third-party' = 'first-party';

				if (!scope) {
					const firstPartyPkgCheck = await fetchPackageJson('astrojs', name, tag);
					if (firstPartyPkgCheck instanceof Error) {
						spinner.warn(
							yellow(`${bold(integration)} is not an official Astro package. Use at your own risk!`)
						);
						const response = await prompts({
							type: 'confirm',
							name: 'askToContinue',
							message: 'Continue?',
							initial: true,
						});
						if (!response.askToContinue) {
							throw new Error(
								`No problem! Find our official integrations at ${cyan(
									'https://astro.build/integrations'
								)}`
							);
						}
						spinner.start('Resolving with third party packages...');
						pkgType = 'third-party';
					} else {
						pkgJson = firstPartyPkgCheck as any;
					}
				}
				if (pkgType === 'third-party') {
					const thirdPartyPkgCheck = await fetchPackageJson(scope, name, tag);
					if (thirdPartyPkgCheck instanceof Error) {
						throw new Error(`Unable to fetch ${bold(integration)}. Does the package exist?`);
					} else {
						pkgJson = thirdPartyPkgCheck as any;
					}
				}

				const resolvedScope = pkgType === 'first-party' ? 'astrojs' : scope;
				const packageName = `${resolvedScope ? `@${resolvedScope}/` : ''}${name}`;

				let dependencies: IntegrationInfo['dependencies'] = [
					[pkgJson['name'], `^${pkgJson['version']}`],
				];

				if (pkgJson['peerDependencies']) {
					for (const peer in pkgJson['peerDependencies']) {
						dependencies.push([peer, pkgJson['peerDependencies'][peer]]);
					}
				}

				let integrationType: IntegrationInfo['type'];
				const keywords = Array.isArray(pkgJson['keywords']) ? pkgJson['keywords'] : [];
				if (keywords.includes('astro-integration')) {
					integrationType = 'integration';
				} else if (keywords.includes('astro-adapter')) {
					integrationType = 'adapter';
				} else {
					throw new Error(
						`${bold(
							packageName
						)} doesn't appear to be an integration or an adapter. Find our official integrations at ${cyan(
							'https://astro.build/integrations'
						)}`
					);
				}

				return { id: integration, packageName, dependencies, type: integrationType };
			})
		);
		spinner.succeed();
		return integrationEntries;
	} catch (e) {
		if (e instanceof Error) {
			spinner.fail(e.message);
			process.exit(1);
		} else {
			throw e;
		}
	}
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
