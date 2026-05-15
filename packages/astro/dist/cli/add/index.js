import fsMod, { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as clack from '@clack/prompts';
import { assertValidPackageName } from '@astrojs/internal-helpers/cli';
import { diffWords } from 'diff';
import { builders, generateCode, loadFile } from 'magicast';
import { getDefaultExportOptions } from 'magicast/helpers';
import { detect, resolveCommand } from 'package-manager-detector';
import colors from 'piccolore';
import maxSatisfying from 'semver/ranges/max-satisfying.js';
import {
	loadTSConfig,
	resolveConfig,
	resolveConfigPath,
	resolveRoot,
} from '../../core/config/index.js';
import {
	defaultTSConfig,
	presets,
	updateTSConfigForFramework,
} from '../../core/config/tsconfig.js';
import * as msg from '../../core/messages/runtime.js';
import { printHelp } from '../../core/messages/runtime.js';
import { appendForwardSlash } from '../../core/path.js';
import { ensureProcessNodeEnv, parseNpmName } from '../../core/util.js';
import { eventCliSession, telemetry } from '../../events/index.js';
import { exec } from '../exec.js';
import { createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';
import { fetchPackageJson, fetchPackageVersions } from '../install-package.js';
const { bold, cyan, dim, green, magenta, red, yellow } = colors;
const ALIASES = /* @__PURE__ */ new Map([
	['solid', 'solid-js'],
	['tailwindcss', 'tailwind'],
]);
const STUBS = {
	ASTRO_CONFIG: `import { defineConfig } from 'astro/config';
// https://astro.build/config
export default defineConfig({});`,
	TAILWIND_GLOBAL_CSS: `@import "tailwindcss";`,
	SVELTE_CONFIG: `import { vitePreprocess } from '@astrojs/svelte';

export default {
	preprocess: vitePreprocess(),
}
`,
	LIT_NPMRC: `# Lit libraries are required to be hoisted due to dependency issues.
public-hoist-pattern[]=*lit*
`,
	DB_CONFIG: `import { defineDb } from 'astro:db';

// https://astro.build/db/config
export default defineDb({
  tables: {}
});
`,
	DB_SEED: `import { db } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
	// TODO
}
`,
	CLOUDFLARE_WRANGLER_CONFIG: (name, compatibilityDate) => `{
	"compatibility_date": ${JSON.stringify(compatibilityDate)},
	"compatibility_flags": ["global_fetch_strictly_public"],
	"name": ${JSON.stringify(name)},
	"main": "@astrojs/cloudflare/entrypoints/server",
	"assets": {
		"directory": "./dist",
		"binding": "ASSETS"
	},
	"observability": {
		"enabled": true
	}
}`,
};
const OFFICIAL_ADAPTER_TO_IMPORT_MAP = {
	netlify: '@astrojs/netlify',
	vercel: '@astrojs/vercel',
	cloudflare: '@astrojs/cloudflare',
	node: '@astrojs/node',
};
async function add(names, { flags }) {
	ensureProcessNodeEnv('production');
	const inlineConfig = flagsToAstroInlineConfig(flags);
	const { userConfig } = await resolveConfig(inlineConfig, 'add');
	telemetry.record(eventCliSession('add', userConfig));
	if (flags.help || names.length === 0) {
		printHelp({
			commandName: 'astro add',
			usage: '[...integrations] [...adapters]',
			tables: {
				Flags: [
					['--yes', 'Accept all prompts.'],
					['--help', 'Show this help message.'],
				],
				'UI Frameworks': [
					['react', 'astro add react'],
					['preact', 'astro add preact'],
					['vue', 'astro add vue'],
					['svelte', 'astro add svelte'],
					['solid-js', 'astro add solid-js'],
					['lit', 'astro add lit'],
					['alpinejs', 'astro add alpinejs'],
				],
				'Documentation Frameworks': [['starlight', 'astro add starlight']],
				'SSR Adapters': [
					['netlify', 'astro add netlify'],
					['vercel', 'astro add vercel'],
					['deno', 'astro add deno'],
					['cloudflare', 'astro add cloudflare'],
					['node', 'astro add node'],
				],
				Others: [
					['db', 'astro add db'],
					['tailwind', 'astro add tailwind'],
					['mdx', 'astro add mdx'],
					['markdoc', 'astro add markdoc'],
					['partytown', 'astro add partytown'],
					['sitemap', 'astro add sitemap'],
				],
			},
			description: `For more integrations, check out: ${cyan('https://astro.build/integrations')}`,
		});
		return;
	}
	const cwd = inlineConfig.root;
	const logger = createLoggerFromFlags(flags);
	const integrationNames = names.map((name) => (ALIASES.has(name) ? ALIASES.get(name) : name));
	const integrations = await validateIntegrations(integrationNames, flags, logger);
	const hasCloudflareIntegration = integrations.some(
		(integration) => integration.id === 'cloudflare',
	);
	let installResult = await tryToInstallIntegrations({ integrations, cwd, flags, logger });
	const rootPath = resolveRoot(cwd);
	const root = pathToFileURL(rootPath);
	root.href = appendForwardSlash(root.href);
	const rawConfigPath = await resolveConfigPath({
		root: rootPath,
		configFile: inlineConfig.configFile,
		fs: fsMod,
	});
	let configURL = rawConfigPath ? pathToFileURL(rawConfigPath) : void 0;
	if (configURL) {
		logger.debug('add', `Found config at ${configURL}`);
	} else {
		logger.info('add', `Unable to locate a config file, generating one for you.`);
		configURL = new URL('./astro.config.mjs', root);
		await fs.writeFile(fileURLToPath(configURL), STUBS.ASTRO_CONFIG, { encoding: 'utf-8' });
	}
	let packageJson = { type: 'unknown' };
	async function getPackageJson() {
		if (packageJson.type === 'exists') {
			return packageJson.data;
		}
		if (packageJson.type === 'does-not-exist') {
			return null;
		}
		const pkgURL = new URL('./package.json', configURL);
		if (existsSync(pkgURL)) {
			packageJson = {
				type: 'exists',
				data: await fs.readFile(fileURLToPath(pkgURL)).then((res) => JSON.parse(res.toString())),
			};
			return packageJson.data;
		}
		packageJson = { type: 'does-not-exist' };
		return null;
	}
	switch (installResult) {
		case 'updated': {
			if (hasCloudflareIntegration) {
				const wranglerConfigURL = new URL('./wrangler.jsonc', configURL);
				if (!existsSync(wranglerConfigURL)) {
					logger.info(
						'SKIP_FORMAT',
						`
  ${magenta(`Astro will scaffold ${green('./wrangler.jsonc')}.`)}
`,
					);
					if (await askToContinue({ flags, logger })) {
						const data = await getPackageJson();
						let compatibilityDate = /* @__PURE__ */ new Date().toISOString().slice(0, 10);
						await fs.writeFile(
							wranglerConfigURL,
							STUBS.CLOUDFLARE_WRANGLER_CONFIG(data?.name ?? 'example', compatibilityDate),
							'utf-8',
						);
					}
				} else {
					logger.debug('add', 'Using existing wrangler configuration');
				}
				await updatePackageJsonScripts({
					configURL,
					flags,
					logger,
					scripts: { 'generate-types': 'wrangler types' },
				});
				await updatePackageJsonOverrides({
					configURL,
					flags,
					logger,
					overrides: { vite: '^7' },
				});
			}
			if (integrations.find((integration) => integration.id === 'tailwind')) {
				const dir = new URL('./styles/', new URL(userConfig.srcDir ?? './src/', root));
				const styles = new URL('./global.css', dir);
				if (!existsSync(styles)) {
					logger.info(
						'SKIP_FORMAT',
						`
  ${magenta(`Astro will scaffold ${green('./src/styles/global.css')}.`)}
`,
					);
					if (await askToContinue({ flags, logger })) {
						if (!existsSync(dir)) {
							await fs.mkdir(dir);
						}
						await fs.writeFile(styles, STUBS.TAILWIND_GLOBAL_CSS, 'utf-8');
					} else {
						logger.info(
							'SKIP_FORMAT',
							`
  @tailwindcss/vite requires additional configuration. Please refer to https://docs.astro.build/en/guides/integrations-guide/tailwind/`,
						);
					}
				} else {
					logger.debug('add', `Using existing tailwind configuration`);
				}
			}
			if (integrations.find((integration) => integration.id === 'svelte')) {
				await setupIntegrationConfig({
					root,
					logger,
					flags,
					integrationName: 'Svelte',
					possibleConfigFiles: ['./svelte.config.js', './svelte.config.cjs', './svelte.config.mjs'],
					defaultConfigFile: './svelte.config.js',
					defaultConfigContent: STUBS.SVELTE_CONFIG,
				});
			}
			if (integrations.find((integration) => integration.id === 'db')) {
				if (!existsSync(new URL('./db/', root))) {
					logger.info(
						'SKIP_FORMAT',
						`
  ${magenta(
		`Astro will scaffold ${green('./db/config.ts')}${magenta(' and ')}${green(
			'./db/seed.ts',
		)}${magenta(' files.')}`,
	)}
`,
					);
					if (await askToContinue({ flags, logger })) {
						await fs.mkdir(new URL('./db', root));
						await Promise.all([
							fs.writeFile(new URL('./db/config.ts', root), STUBS.DB_CONFIG, { encoding: 'utf-8' }),
							fs.writeFile(new URL('./db/seed.ts', root), STUBS.DB_SEED, { encoding: 'utf-8' }),
						]);
					} else {
						logger.info(
							'SKIP_FORMAT',
							`
  Astro DB requires additional configuration. Please refer to https://astro.build/db/config`,
						);
					}
				} else {
					logger.debug('add', `Using existing db configuration`);
				}
			}
			if (
				integrations.find((integration) => integration.id === 'lit') &&
				(await detect({ cwd: fileURLToPath(root) }))?.name === 'pnpm'
			) {
				await setupIntegrationConfig({
					root,
					logger,
					flags,
					integrationName: 'Lit',
					possibleConfigFiles: ['./.npmrc'],
					defaultConfigFile: './.npmrc',
					defaultConfigContent: STUBS.LIT_NPMRC,
				});
			}
			if (integrations.find((integration) => integration.id === 'vercel')) {
				const gitignorePath = new URL('./.gitignore', root);
				const gitignoreEntry = '.vercel';
				if (existsSync(gitignorePath)) {
					const content = await fs.readFile(fileURLToPath(gitignorePath), { encoding: 'utf-8' });
					if (!content.includes(gitignoreEntry)) {
						logger.info(
							'SKIP_FORMAT',
							`
  ${magenta(`Astro will add ${green('.vercel')} to ${green('.gitignore')}.`)}
`,
						);
						if (await askToContinue({ flags, logger })) {
							const newContent = content.endsWith('\n')
								? `${content}${gitignoreEntry}
`
								: `${content}
${gitignoreEntry}
`;
							await fs.writeFile(fileURLToPath(gitignorePath), newContent, { encoding: 'utf-8' });
							logger.debug('add', 'Updated .gitignore with .vercel');
						}
					} else {
						logger.debug('add', '.vercel already in .gitignore');
					}
				} else {
					logger.info(
						'SKIP_FORMAT',
						`
  ${magenta(`Astro will create ${green('.gitignore')} with ${green('.vercel')}.`)}
`,
					);
					if (await askToContinue({ flags, logger })) {
						await fs.writeFile(
							fileURLToPath(gitignorePath),
							`${gitignoreEntry}
`,
							{
								encoding: 'utf-8',
							},
						);
						logger.debug('add', 'Created .gitignore with .vercel');
					}
				}
			}
			break;
		}
		case 'cancelled': {
			logger.info(
				'SKIP_FORMAT',
				msg.cancelled(
					`Dependencies ${bold('NOT')} installed.`,
					`Be sure to install them manually before continuing!`,
				),
			);
			break;
		}
		case 'failure': {
			throw createPrettyError(new Error(`Unable to install dependencies`));
		}
		case 'none':
			break;
	}
	let mod;
	try {
		mod = await loadFile(fileURLToPath(configURL));
		logger.debug('add', 'Parsed astro config');
		if (mod.exports.default.$type !== 'function-call') {
			mod.imports.$prepend({ imported: 'defineConfig', from: 'astro/config' });
			mod.exports.default = builders.functionCall('defineConfig', mod.exports.default);
		} else if (mod.exports.default.$args[0] == null) {
			mod.exports.default.$args[0] = {};
		}
		logger.debug('add', 'Astro config ensured `defineConfig`');
		for (const integration of integrations) {
			if (isAdapter(integration)) {
				const officialExportName = OFFICIAL_ADAPTER_TO_IMPORT_MAP[integration.id];
				if (officialExportName) {
					setAdapter(mod, integration, officialExportName);
				} else {
					logger.info(
						'SKIP_FORMAT',
						`
  ${magenta(
		`Check our deployment docs for ${bold(
			integration.integrationName,
		)} to update your "adapter" config.`,
	)}`,
					);
				}
			} else if (integration.id === 'tailwind') {
				addVitePlugin(mod, 'tailwindcss', '@tailwindcss/vite');
			} else {
				addIntegration(mod, integration);
			}
			logger.debug('add', `Astro config added integration ${integration.id}`);
		}
	} catch (err) {
		logger.debug('add', 'Error parsing/modifying astro config: ', err);
		throw createPrettyError(err);
	}
	let configResult;
	if (mod) {
		try {
			configResult = await updateAstroConfig({
				configURL,
				mod,
				flags,
				logger,
				logAdapterInstructions: integrations.some(isAdapter),
			});
		} catch (err) {
			logger.debug('add', 'Error updating astro config', err);
			throw createPrettyError(err);
		}
	}
	switch (configResult) {
		case 'cancelled': {
			logger.info(
				'SKIP_FORMAT',
				msg.cancelled(`Your configuration has ${bold('NOT')} been updated.`),
			);
			break;
		}
		case 'none': {
			const data = await getPackageJson();
			if (data) {
				const { dependencies = {}, devDependencies = {} } = data;
				const deps = Object.keys(Object.assign(dependencies, devDependencies));
				const missingDeps = integrations.filter(
					(integration) => !deps.includes(integration.packageName),
				);
				if (missingDeps.length === 0) {
					logger.info('SKIP_FORMAT', msg.success(`Configuration up-to-date.`));
					break;
				}
			}
			logger.info('SKIP_FORMAT', msg.success(`Configuration up-to-date.`));
			break;
		}
		// NOTE: failure shouldn't happen in practice because `updateAstroConfig` doesn't return that.
		// Pipe this to the same handling as `'updated'` for now.
		case 'failure':
		case 'updated':
		case void 0: {
			const list = integrations
				.map((integration) => `  - ${integration.integrationName}`)
				.join('\n');
			logger.info(
				'SKIP_FORMAT',
				msg.success(
					`Added the following integration${integrations.length === 1 ? '' : 's'} to your project:
${list}`,
				),
			);
			if (integrations.find((integration) => integration.integrationName === 'tailwind')) {
				logger.warn(
					'SKIP_FORMAT',
					msg.actionRequired(
						'You must import your Tailwind stylesheet, e.g. in a shared layout:\n',
					),
				);
				clack.box(
					getDiffContent('---\n---', "---\nimport '../styles/global.css'\n---"),
					'src/layouts/Layout.astro',
					{
						rounded: true,
						withGuide: false,
						width: 'auto',
					},
				);
			}
		}
	}
	const updateTSConfigResult = await updateTSConfig(cwd, logger, integrations, flags, {
		addIncludes: hasCloudflareIntegration ? ['./worker-configuration.d.ts'] : [],
	});
	switch (updateTSConfigResult) {
		case 'none': {
			break;
		}
		case 'cancelled': {
			logger.info(
				'SKIP_FORMAT',
				msg.cancelled(`Your TypeScript configuration has ${bold('NOT')} been updated.`),
			);
			break;
		}
		case 'failure': {
			throw new Error(
				`Unknown error parsing tsconfig.json or jsconfig.json. Could not update TypeScript settings.`,
			);
		}
		case 'updated':
			logger.info('SKIP_FORMAT', msg.success(`Successfully updated tsconfig`));
	}
}
function isAdapter(integration) {
	return integration.type === 'adapter';
}
const toIdent = (name) => {
	const ident = name
		.trim()
		.replace(/[-_./]?astro(?:js)?[-_.]?/g, '')
		.replace(/\.js/, '')
		.replace(/[.\-_/]+([a-zA-Z])/g, (_, w) => w.toUpperCase())
		.replace(/^[^a-zA-Z$_]+/, '')
		.replace(/@.*$/, '');
	return `${ident[0].toLowerCase()}${ident.slice(1)}`;
};
function createPrettyError(err) {
	err.message = `Astro could not update your astro.config.js file safely.
Reason: ${err.message}

You will need to add these integration(s) manually.
Documentation: https://docs.astro.build/en/guides/integrations/`;
	return err;
}
function addIntegration(mod, integration) {
	const config = getDefaultExportOptions(mod);
	const integrationId = toIdent(integration.id);
	if (!mod.imports.$items.some((imp) => imp.local === integrationId)) {
		mod.imports.$append({
			imported: 'default',
			local: integrationId,
			from: integration.packageName,
		});
	}
	config.integrations ??= [];
	if (
		!config.integrations.$ast.elements.some(
			(el) =>
				el.type === 'CallExpression' &&
				el.callee.type === 'Identifier' &&
				el.callee.name === integrationId,
		)
	) {
		config.integrations.push(builders.functionCall(integrationId));
	}
}
function addVitePlugin(mod, pluginId, packageName) {
	const config = getDefaultExportOptions(mod);
	if (!mod.imports.$items.some((imp) => imp.local === pluginId)) {
		mod.imports.$append({
			imported: 'default',
			local: pluginId,
			from: packageName,
		});
	}
	config.vite ??= {};
	config.vite.plugins ??= [];
	if (
		!config.vite.plugins.$ast.elements.some(
			(el) =>
				el.type === 'CallExpression' &&
				el.callee.type === 'Identifier' &&
				el.callee.name === pluginId,
		)
	) {
		config.vite.plugins.push(builders.functionCall(pluginId));
	}
}
function setAdapter(mod, adapter, exportName) {
	const config = getDefaultExportOptions(mod);
	const adapterId = toIdent(adapter.id);
	if (!mod.imports.$items.some((imp) => imp.local === adapterId)) {
		mod.imports.$append({
			imported: 'default',
			local: adapterId,
			from: exportName,
		});
	}
	switch (adapter.id) {
		case 'node':
			config.adapter = builders.functionCall(adapterId, { mode: 'standalone' });
			break;
		default:
			config.adapter = builders.functionCall(adapterId);
			break;
	}
}
async function updateAstroConfig({ configURL, mod, flags, logger, logAdapterInstructions }) {
	const input = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	const output = generateCode(mod, {
		format: {
			objectCurlySpacing: true,
			useTabs: false,
			tabWidth: 2,
		},
	}).code;
	if (input === output) {
		return 'none';
	}
	const diff = getDiffContent(input, output);
	if (!diff) {
		return 'none';
	}
	logger.info(
		'SKIP_FORMAT',
		`
  ${magenta('Astro will make the following changes to your config file:')}`,
	);
	clack.box(diff, configURL.pathname.split('/').pop(), {
		rounded: true,
		withGuide: false,
		width: 'auto',
	});
	if (logAdapterInstructions) {
		logger.info(
			'SKIP_FORMAT',
			magenta(
				`  For complete deployment options, visit
  ${bold('https://docs.astro.build/en/guides/deploy/')}
`,
			),
		);
	}
	if (await askToContinue({ flags, logger })) {
		await fs.writeFile(fileURLToPath(configURL), output, { encoding: 'utf-8' });
		logger.debug('add', `Updated astro config`);
		return 'updated';
	} else {
		return 'cancelled';
	}
}
async function updatePackageJsonOverrides({ configURL, flags, logger, overrides }) {
	const pkgURL = new URL('./package.json', configURL);
	if (!existsSync(pkgURL)) {
		logger.debug('add', 'No package.json found, skipping overrides update');
		return 'none';
	}
	const pkgPath = fileURLToPath(pkgURL);
	const input = await fs.readFile(pkgPath, { encoding: 'utf-8' });
	const pkgJson = JSON.parse(input);
	pkgJson.overrides ??= {};
	let hasChanges = false;
	for (const [name, range] of Object.entries(overrides)) {
		if (!(name in pkgJson.overrides)) {
			pkgJson.overrides[name] = range;
			hasChanges = true;
		}
	}
	if (!hasChanges) {
		return 'none';
	}
	const output = JSON.stringify(pkgJson, null, 2);
	const diff = getDiffContent(input, output);
	if (!diff) {
		return 'none';
	}
	logger.info(
		'SKIP_FORMAT',
		`
  ${magenta('Astro will add the following overrides to your package.json:')}`,
	);
	clack.box(diff, 'package.json', {
		rounded: true,
		withGuide: false,
		width: 'auto',
	});
	if (await askToContinue({ flags, logger })) {
		await fs.writeFile(pkgPath, output, { encoding: 'utf-8' });
		logger.debug('add', 'Updated package.json overrides');
		return 'updated';
	} else {
		return 'cancelled';
	}
}
async function updatePackageJsonScripts({ configURL, flags, logger, scripts }) {
	const pkgURL = new URL('./package.json', configURL);
	if (!existsSync(pkgURL)) {
		logger.debug('add', 'No package.json found, skipping scripts update');
		return 'none';
	}
	const pkgPath = fileURLToPath(pkgURL);
	const input = await fs.readFile(pkgPath, { encoding: 'utf-8' });
	const pkgJson = JSON.parse(input);
	pkgJson.scripts ??= {};
	let hasChanges = false;
	for (const [name, command] of Object.entries(scripts)) {
		if (!(name in pkgJson.scripts)) {
			pkgJson.scripts[name] = command;
			hasChanges = true;
		}
	}
	if (!hasChanges) {
		return 'none';
	}
	const output = JSON.stringify(pkgJson, null, 2);
	const diff = getDiffContent(input, output);
	if (!diff) {
		return 'none';
	}
	logger.info(
		'SKIP_FORMAT',
		`
  ${magenta('Astro will add the following scripts to your package.json:')}`,
	);
	clack.box(diff, 'package.json', {
		rounded: true,
		withGuide: false,
		width: 'auto',
	});
	if (await askToContinue({ flags, logger })) {
		await fs.writeFile(pkgPath, output, { encoding: 'utf-8' });
		logger.debug('add', 'Updated package.json scripts');
		return 'updated';
	} else {
		return 'cancelled';
	}
}
async function convertIntegrationsToInstallSpecifiers(integrations) {
	const ranges = {};
	for (let { dependencies } of integrations) {
		for (const [name, range] of dependencies) {
			ranges[name] = range;
		}
	}
	return Promise.all(
		Object.entries(ranges).map(([name, range]) => resolveRangeToInstallSpecifier(name, range)),
	);
}
async function resolveRangeToInstallSpecifier(name, range) {
	const versions = await fetchPackageVersions(name);
	if (versions instanceof Error) return name;
	const stableVersions = versions.filter((v) => !v.includes('-'));
	const maxStable = maxSatisfying(stableVersions, range) ?? maxSatisfying(versions, range);
	if (!maxStable) return name;
	return `${name}@^${maxStable}`;
}
const INHERITED_FLAGS = /* @__PURE__ */ new Set([
	'P',
	'save-prod',
	'D',
	'save-dev',
	'E',
	'save-exact',
	'no-save',
]);
async function tryToInstallIntegrations({ integrations, cwd, flags, logger }) {
	const packageManager = await detect({
		cwd,
		// Include the `install-metadata` strategy to have the package manager that's
		// used for installation take precedence
		strategies: ['install-metadata', 'lockfile', 'packageManager-field'],
	});
	logger.debug('add', `package manager: "${packageManager?.name}"`);
	if (!packageManager) return 'none';
	const inheritedFlags = Object.entries(flags)
		.map(([flag]) => {
			if (flag === '_') return;
			if (INHERITED_FLAGS.has(flag)) {
				if (flag.length === 1) return `-${flag}`;
				return `--${flag}`;
			}
		})
		.filter(Boolean)
		.flat();
	const installCommand = resolveCommand(packageManager?.agent ?? 'npm', 'add', inheritedFlags);
	if (!installCommand) return 'none';
	const installSpecifiers = await convertIntegrationsToInstallSpecifiers(integrations).then(
		(specifiers) =>
			installCommand.command === 'deno'
				? specifiers.map((specifier) => `npm:${specifier}`)
				: specifiers,
	);
	const coloredOutput = `${bold(installCommand.command)} ${installCommand.args.join(' ')} ${cyan(installSpecifiers.join(' '))}`;
	logger.info(
		'SKIP_FORMAT',
		`
  ${magenta('Astro will run the following command:')}
  ${dim('If you skip this step, you can always run it yourself later')}`,
	);
	clack.box(coloredOutput, void 0, {
		rounded: true,
		withGuide: false,
		width: 'auto',
	});
	if (await askToContinue({ flags, logger })) {
		const spinner = clack.spinner({ withGuide: false });
		spinner.start('Installing dependencies...');
		try {
			await exec(installCommand.command, [...installCommand.args, ...installSpecifiers], {
				nodeOptions: {
					cwd,
					// reset NODE_ENV to ensure install command run in dev mode
					env: { NODE_ENV: void 0 },
				},
			});
			spinner.stop('Dependencies installed.');
			return 'updated';
		} catch (err) {
			spinner.error('Error installing dependencies.');
			logger.debug('add', 'Error installing dependencies', err);
			console.error('\n', err.stdout || err.message, '\n');
			return 'failure';
		}
	} else {
		return 'cancelled';
	}
}
async function validateIntegrations(integrations, flags, logger) {
	for (const integration of integrations) {
		assertValidPackageName(integration);
	}
	const spinner = clack.spinner({ withGuide: false });
	spinner.start('Resolving packages...');
	try {
		const integrationEntries = await Promise.all(
			integrations.map(async (integration) => {
				const parsed = parseIntegrationName(integration);
				if (!parsed) {
					throw new Error(`${bold(integration)} does not appear to be a valid package name!`);
				}
				let { scope, name, tag } = parsed;
				let pkgJson;
				let pkgType;
				if (scope && scope !== '@astrojs') {
					pkgType = 'third-party';
				} else {
					const firstPartyPkgCheck = await fetchPackageJson('@astrojs', name, tag);
					if (firstPartyPkgCheck instanceof Error) {
						if (firstPartyPkgCheck.message) {
							spinner.message(yellow(firstPartyPkgCheck.message));
						}
						spinner.message(yellow(`${bold(integration)} is not an official Astro package.`));
						if (!(await askToContinue({ flags, logger }))) {
							throw new Error(
								`No problem! Find our official integrations at ${cyan(
									'https://astro.build/integrations',
								)}`,
							);
						}
						spinner.message('Resolving with third party packages...');
						pkgType = 'third-party';
					} else {
						pkgType = 'first-party';
						pkgJson = firstPartyPkgCheck;
					}
				}
				if (pkgType === 'third-party') {
					const thirdPartyPkgCheck = await fetchPackageJson(scope, name, tag);
					if (thirdPartyPkgCheck instanceof Error) {
						if (thirdPartyPkgCheck.message) {
							spinner.message(yellow(thirdPartyPkgCheck.message));
						}
						throw new Error(`Unable to fetch ${bold(integration)}. Does the package exist?`);
					} else {
						pkgJson = thirdPartyPkgCheck;
					}
				}
				const resolvedScope = pkgType === 'first-party' ? '@astrojs' : scope;
				const packageName = `${resolvedScope ? `${resolvedScope}/` : ''}${name}`;
				let integrationName = packageName;
				let dependencies = [[pkgJson['name'], `^${pkgJson['version']}`]];
				if (pkgJson['peerDependencies']) {
					const meta = pkgJson['peerDependenciesMeta'] || {};
					for (const peer in pkgJson['peerDependencies']) {
						const optional = meta[peer]?.optional || false;
						const isAstro = peer === 'astro';
						if (!optional && !isAstro) {
							dependencies.push([peer, pkgJson['peerDependencies'][peer]]);
						}
					}
				}
				let integrationType;
				const keywords = Array.isArray(pkgJson['keywords']) ? pkgJson['keywords'] : [];
				if (keywords.includes('astro-integration')) {
					integrationType = 'integration';
				} else if (keywords.includes('astro-adapter')) {
					integrationType = 'adapter';
				} else {
					throw new Error(
						`${bold(
							packageName,
						)} doesn't appear to be an integration or an adapter. Find our official integrations at ${cyan(
							'https://astro.build/integrations',
						)}`,
					);
				}
				if (integration === 'tailwind') {
					integrationName = 'tailwind';
					dependencies = [
						['@tailwindcss/vite', '^4.0.0'],
						['tailwindcss', '^4.0.0'],
					];
				}
				return {
					id: integration,
					packageName,
					dependencies,
					type: integrationType,
					integrationName,
				};
			}),
		);
		spinner.stop('Resolved packages.');
		return integrationEntries;
	} catch (e) {
		if (e instanceof Error) {
			spinner.error(e.message);
			process.exit(1);
		} else {
			throw e;
		}
	}
}
async function updateTSConfig(cwd = process.cwd(), logger, integrationsInfo, flags, options) {
	const integrations = integrationsInfo.map((integration) => integration.id);
	const includesToAppend = Array.from(new Set((options?.addIncludes ?? []).filter(Boolean)));
	const firstIntegrationWithTSSettings = integrations.find((integration) =>
		presets.has(integration),
	);
	if (!firstIntegrationWithTSSettings && includesToAppend.length === 0) {
		return 'none';
	}
	let inputConfig = await loadTSConfig(cwd);
	let inputConfigText = '';
	if (inputConfig.error === 'invalid-config') {
		logger.warn(`add`, `Couldn't parse tsconfig.json or jsconfig.json: ${inputConfig.message}`);
		return 'failure';
	} else if (inputConfig.error === 'missing-config') {
		logger.debug('add', "Couldn't find tsconfig.json or jsconfig.json, generating one");
		const tsconfigFile = path.join(cwd, 'tsconfig.json');
		inputConfig = {
			tsconfig: defaultTSConfig,
			tsconfigFile,
			rawConfig: defaultTSConfig,
			sources: [tsconfigFile],
		};
	} else {
		inputConfigText = JSON.stringify(inputConfig.rawConfig, null, 2);
	}
	const configFileName = path.basename(inputConfig.tsconfigFile);
	let outputConfig = firstIntegrationWithTSSettings
		? updateTSConfigForFramework(inputConfig.rawConfig, firstIntegrationWithTSSettings)
		: { ...inputConfig.rawConfig };
	for (const include of includesToAppend) {
		const currentIncludes = Array.isArray(outputConfig.include) ? outputConfig.include : [];
		if (!currentIncludes.includes(include)) {
			outputConfig = { ...outputConfig, include: [...currentIncludes, include] };
		}
	}
	const output = JSON.stringify(outputConfig, null, 2);
	const diff = getDiffContent(inputConfigText, output);
	if (!diff) {
		return 'none';
	}
	logger.info(
		'SKIP_FORMAT',
		`
  ${magenta(`Astro will make the following changes to your ${configFileName}:`)}`,
	);
	clack.box(diff, configFileName, {
		rounded: true,
		withGuide: false,
		width: 'auto',
	});
	if (firstIntegrationWithTSSettings) {
		const conflictingIntegrations = Array.from(presets.keys()).filter((config) => config !== 'vue');
		const hasConflictingIntegrations =
			integrations.filter((integration) => presets.has(integration)).length > 1 &&
			integrations.filter((integration) => conflictingIntegrations.includes(integration)).length >
				0;
		if (hasConflictingIntegrations) {
			logger.info(
				'SKIP_FORMAT',
				red(
					`  ${bold(
						'Caution:',
					)} Selected UI frameworks require conflicting tsconfig.json settings, as such only settings for ${bold(
						firstIntegrationWithTSSettings,
					)} were used.
  More information: https://docs.astro.build/en/guides/typescript/#errors-typing-multiple-jsx-frameworks-at-the-same-time
`,
				),
			);
		}
	}
	if (await askToContinue({ flags, logger })) {
		await fs.writeFile(inputConfig.tsconfigFile, output, {
			encoding: 'utf-8',
		});
		logger.debug('add', `Updated ${configFileName} file`);
		return 'updated';
	} else {
		return 'cancelled';
	}
}
function parseIntegrationName(spec) {
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
let hasHintedAboutYesFlag = false;
async function askToContinue({ flags, logger }) {
	if (flags.yes || flags.y) return true;
	if (!hasHintedAboutYesFlag) {
		hasHintedAboutYesFlag = true;
		logger.info('SKIP_FORMAT', dim('  To run this command without prompts, pass the --yes flag\n'));
	}
	const response = await clack.confirm({
		message: colors.bold('Continue?'),
		initialValue: true,
		withGuide: false,
	});
	return response === true;
}
function getDiffContent(input, output) {
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
		return null;
	}
	let diffed = output;
	for (let newContent of changes) {
		const coloredOutput = newContent
			.split('\n')
			.map((ln) => (ln ? green(ln) : ''))
			.join('\n');
		diffed = diffed.replace(newContent, coloredOutput);
	}
	return diffed;
}
async function setupIntegrationConfig(opts) {
	const logger = opts.logger;
	const possibleConfigFiles = opts.possibleConfigFiles.map((p) =>
		fileURLToPath(new URL(p, opts.root)),
	);
	let alreadyConfigured = false;
	for (const possibleConfigPath of possibleConfigFiles) {
		if (existsSync(possibleConfigPath)) {
			alreadyConfigured = true;
			break;
		}
	}
	if (!alreadyConfigured) {
		logger.info(
			'SKIP_FORMAT',
			`
  ${magenta(`Astro will generate a minimal ${bold(opts.defaultConfigFile)} file.`)}
`,
		);
		if (await askToContinue({ flags: opts.flags, logger })) {
			await fs.writeFile(
				fileURLToPath(new URL(opts.defaultConfigFile, opts.root)),
				opts.defaultConfigContent,
				{
					encoding: 'utf-8',
				},
			);
			logger.debug('add', `Generated default ${opts.defaultConfigFile} file`);
		}
	} else {
		logger.debug('add', `Using existing ${opts.integrationName} configuration`);
	}
}
export { add };
