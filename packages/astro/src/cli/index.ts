import * as colors from 'kleur/colors';
import type yargs from 'yargs-parser';
import { ASTRO_VERSION } from '../core/constants.js';

/**
 * Run the given command with the given flags.
 * NOTE: This function provides no error handling, so be sure
 * to present user-friendly error output where the fn is called.
 **/
async function runCommand(cmd: string, flags: yargs.Arguments) {
	// These commands can run directly without parsing the user config.
	switch (cmd) {
		case 'sync': {
			const { sync } = await import('./sync/index.js');
			await sync({ flags });
			return;
		}
		case 'preferences': {
			const { preferences } = await import('./preferences/index.js');
			const [subcommand, key, value] = flags._.slice(3).map((v) => v.toString());
			const exitCode = await preferences(subcommand, key, value, { flags });
			return process.exit(exitCode);
		}
	}

	// In verbose/debug mode, we log the debug logs asap before any potential errors could appear
	if (flags.verbose) {
		const { enableVerboseLogging } = await import('../core/logger/node.js');
		enableVerboseLogging();
	}

	const { notify } = await import('./telemetry/index.js');
	await notify();

	// These commands uses the logging and user config. All commands are assumed to have been handled
	// by the end of this switch statement.
	switch (cmd) {
		case 'db':
		case 'login':
		case 'logout':
		case 'link':
		case 'init': {
			const { db } = await import('./db/index.js');
			await db({ flags });
			return;
		}
		case 'dev': {
			const { dev } = await import('./dev/index.js');
			const server = await dev({ flags });
			if (server) {
				return await new Promise(() => {}); // lives forever
			}
			return;
		}
		case 'build': {
			const { build } = await import('./build/index.js');
			await build({ flags });
			return;
		}
		case 'preview': {
			const { preview } = await import('./preview/index.js');
			const server = await preview({ flags });
			if (server) {
				return await server.closed(); // keep alive until the server is closed
			}
			return;
		}
		case 'check': {
			const { check } = await import('./check/index.js');
			const checkServer = await check(flags);
			if (flags.watch) {
				return await new Promise(() => {}); // lives forever
			} else {
				return process.exit(checkServer ? 1 : 0);
			}
		}
	}

	// No command handler matched! This is unexpected.
	throw new Error(`Error running ${cmd} -- no command found.`);
}

import { Command } from 'commander';

const program = new Command();

interface GlobalOptions {
	config?: string;
	root?: string;
	site?: string;
	base?: string;
	verbose?: boolean;
	silent?: boolean;
}

program
	.name('astro')
	.usage('[command] [...flags]')
	.description('Build faster websites.')
	.option('--config <path>', 'Specify your config file.')
	.option('--root <path>', 'Specify your project root folder.')
	.option('--site <url>', 'Specify your project site.')
	.option('--base <pathname>', 'Specify your project base.')
	.option('--verbose', 'Enable verbose logging.')
	.option('--silent', 'Disable all logging.')
	.version(
		`${colors.bgGreen(colors.black(` astro `))} ${colors.green(`v${ASTRO_VERSION}`)}`,
		'--version',
		'Show the version number and exit.',
	)
	.helpOption('--help, -h', 'Show this help message.')
	.action(program.help);

program
	.command('info')
	.description('Outputs Astro informations.')
	.option('--copy', 'Force the copy of the output.')
	.action(async (options: { copy?: boolean }) => {
		const { printInfo } = await import('./info/index.js');
		const globalOptions = program.opts<GlobalOptions>();
		await printInfo({
			inlineConfig: {
				configFile: globalOptions.config,
				root: globalOptions.root,
				site: globalOptions.site,
				base: globalOptions.base,
			},
			force: options.copy,
		});
	});

program
	.command('create-key')
	.description('Generates a key to encrypt props passed to server islands.')
	.action(async () => {
		const [{ createKey }, { createLoggerFromFlags }, { createCryptoKeyGenerator }] =
			await Promise.all([
				import('./create-key/core/create-key.js'),
				import('./flags.js'),
				import('./create-key/infra/crypto-key-generator.js'),
			]);
		const globalOptions = program.opts<GlobalOptions>();
		const logger = createLoggerFromFlags({
			verbose: globalOptions.verbose,
			silent: globalOptions.silent,
		});
		const keyGenerator = createCryptoKeyGenerator();
		await createKey({ logger, keyGenerator });
	});

program
	.command('docs')
	.description('Launches the Astro Docs website directly from the terminal.')
	.action(async () => {
		const { docs } = await import('./docs/index.js');
		await docs();
	});

program
	.command('telemetry')
	.usage('[command]')
	.description('Update Astro telemetry settings.')
	.addCommand(
		new Command()
			.name('enable')
			.description('Enable anonymous data collection.')
			.action(async () => {
				const [{ createLoggerFromFlags }, { enable }] = await Promise.all([
					import('./flags.js'),
					import('./telemetry/enable.js'),
				]);
				const globalOptions = program.opts<GlobalOptions>();
				const logger = createLoggerFromFlags({
					verbose: globalOptions.verbose,
					silent: globalOptions.silent,
				});
				enable({ logger });
			}),
	)
	.addCommand(
		new Command()
			.name('disable')
			.description('Disable anonymous data collection.')
			.action(async () => {
				const [{ createLoggerFromFlags }, { disable }] = await Promise.all([
					import('./flags.js'),
					import('./telemetry/disable.js'),
				]);
				const globalOptions = program.opts<GlobalOptions>();
				const logger = createLoggerFromFlags({
					verbose: globalOptions.verbose,
					silent: globalOptions.silent,
				});
				disable({ logger });
			}),
	)
	.addCommand(
		new Command()
			.name('reset')
			.description('Reset anonymous data collection settings.')
			.action(async () => {
				const [{ createLoggerFromFlags }, { reset }] = await Promise.all([
					import('./flags.js'),
					import('./telemetry/reset.js'),
				]);
				const globalOptions = program.opts<GlobalOptions>();
				const logger = createLoggerFromFlags({
					verbose: globalOptions.verbose,
					silent: globalOptions.silent,
				});
				reset({ logger });
			}),
	);

// TODO: sync
// TODO: preferences

const withTelemetryNotice = (command: Command) =>
	command.hook('preAction', async () => {
		const { notify } = await import('./telemetry/index.js');
		await notify();
	});

withTelemetryNotice(
	program
		.command('add')
		.description(
			`For more integrations, check out: ${colors.cyan('https://astro.build/integrations')}`,
		)
		.argument('[packages...]')
		.option('--yes, -y', 'Accept all prompts.', false)
		// Allow forwarding of standard `npm install` flags
		// See https://docs.npmjs.com/cli/v8/commands/npm-install#description
		.option('--save-prod, -P')
		.option('--save-dev, -D')
		.option('--save-exact, -E')
		.option('--no-save')
		.addHelpText(
			'after',
			`
UI Frameworks:
  react     astro add react
  preact    astro add preact
  vue       astro add vue
  svelte    astro add svelte
  solids    astro add solid-js
  lit       astro add lit
  alpinejs  astro add alpinejs

Documentation Frameworks:
  starlight  astro add starlight

SSR Adapters:
  netlify     astro add netlify
  vercel      astro add vercel
  deno        astro add deno
  cloudflare  astro add cloudflare
  node        astro add node

Others:
  db         astro add db
  tailwind   astro add tailwind
  mdx        astro add mdx
  markdoc    astro add markdoc
  partytown  astro add partytown
  sitemap    astro add sitemap
`,
		)
		.action(
			async (
				packages: Array<string>,
				options: {
					yes: boolean;

					'save-prod'?: boolean;
					'save-dev'?: boolean;
					'save-exact'?: boolean;
					'no-save'?: boolean;
				},
				command: Command,
			) => {
				if (packages.length === 0) {
					return command.help();
				}

				const [{ createLoggerFromFlags }, { add }] = await Promise.all([
					import('./flags.js'),
					import('./add/index.js'),
				]);
				const globalOptions = program.opts<GlobalOptions>();
				const logger = createLoggerFromFlags({
					verbose: globalOptions.verbose,
					silent: globalOptions.silent,
				});
				await add({
					names: packages,
					inlineConfig: {
						configFile: globalOptions.config,
						root: globalOptions.root,
						site: globalOptions.site,
						base: globalOptions.base,
					},
					logger,
					yes: options.yes,
					inheritedFlags: {
						'save-prod': options['save-prod'],
						'save-dev': options['save-dev'],
						'save-exact': options['save-exact'],
						'no-save': options['no-save'],
					},
				});
			},
		),
);

/** The primary CLI action */
export async function cli(argv: string[]) {
	// TODO: error handling
	await program.parseAsync(argv);
}
