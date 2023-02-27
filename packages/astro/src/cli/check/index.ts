/* eslint-disable no-console */
import { AstroCheck, DiagnosticSeverity, GetDiagnosticsResult } from '@astrojs/language-server';
import type { AstroSettings } from '../../@types/astro';
import type { LogOptions } from '../../core/logger/core.js';
import glob from 'fast-glob';
import * as fs from 'fs';
import { bold, dim, red, yellow } from 'kleur/colors';
import { createRequire } from 'module';
import ora from 'ora';
import { fileURLToPath, pathToFileURL } from 'url';
import { printDiagnostic } from './print.js';
import { Arguments } from 'yargs-parser';
import { printHelp } from '../../core/messages.js';
import type { Arguments as Flags } from 'yargs-parser';
import { debug, info } from '../../core/logger/core.js';
import { createServer, ViteDevServer } from 'vite';
import { createVite } from '../../core/create-vite.js';
import type { CreateViteOptions } from '../../core/create-vite';
import type { SyncOptions, ProcessExit } from '../../core/sync';
import fsMod from 'fs';

type DiagnosticResult = {
	errors: number;
	// The language server cannot actually return any warnings at the moment, but we'll keep this here for future use
	warnings: number;
	hints: number;
};

type CheckPayload = {
	/**
	 * Astro settings
	 */
	settings: AstroSettings;
	/**
	 * Flags passed via CLI
	 */
	flags: Flags;

	/**
	 * Logging options
	 */
	logging: LogOptions;
};

type CheckFlags = {
	/**
	 * Whether the `check` command should watch for `.astro` and report errors
	 * @default {false}
	 */
	watch: boolean;
};

export enum CheckResult {
	ExitWithSuccess,
	ExitWithError,
	Listen,
}
export async function check(
	settings: AstroSettings,
	{ logging, flags }: { logging: LogOptions; flags: Arguments }
) {
	if (flags.help || flags.h) {
		printHelp({
			commandName: 'astro check',
			usage: '[...flags]',
			tables: {
				Flags: [['--help (-h)', 'See all available flags.']],
			},
			description: `Runs diagnostics against your project and reports errors to the console.`,
		});
		return;
	}
	console.log(bold('astro check'));

const ASTRO_GLOB_PATTERN = '**/*.astro';

/**
 * Checks `.astro` files for possible errors.
 *
 * If the `--check` flag is provided, the command runs indefinitely and provides diagnostics
 * when `.astro` files are modified.
 *
 * Every time an astro files is modified, content collections are also generated.
 *
 * @param {CheckPayload} options
 * @param {Flags} options.flags
 * @param {LogOptions} options.logging
 * @param {AstroSettings} options.settings
 */
export async function check({ settings, logging, flags }: CheckPayload): Promise<CheckResult> {
	let checkFlags = parseFlags(flags);
	let options: CreateViteOptions = { settings, logging, mode: 'build', fs };
	if (checkFlags.watch) {
		info(logging, 'check', 'Checking files in watch mode');
		options.isWatcherEnabled = true;
	} else {
		info(logging, 'check', 'Checking files');
	}
	// We create a server to start doing our operations
	const viteServer = await createServer(
		await createVite(
			{
				server: { middlewareMode: true, hmr: false },
				optimizeDeps: { entries: [] },
				logLevel: 'silent',
			},
			options
		)
	);

	const { syncCli } = await import('../../core/sync/index.js');
	const root = settings.config.root;
	const require = createRequire(import.meta.url);
	let diagnosticChecker = new AstroCheck(
		root.toString(),
		require.resolve('typescript/lib/tsserverlibrary.js', { paths: [root.toString()] })
	);

	const checker = new Checker({
		syncCli,
		settings,
		server: viteServer,
		fileSystem: fs,
		logging,
		diagnosticChecker,
		watch: checkFlags.watch,
	});
	return await checker.run(checkFlags.watch);
}

type CheckerConstructor = {
	server: ViteDevServer;
	diagnosticChecker: AstroCheck;

	watch: boolean;

	syncCli: (settings: AstroSettings, options: SyncOptions) => Promise<ProcessExit>;

	settings: Readonly<AstroSettings>;

	logging: Readonly<LogOptions>;

	fileSystem: typeof fsMod;
};

/**
 * Responsible to check files - classic or watch mode - and report diagnostics.
 *
 * When in watch mode, the class does a whole check pass, and then starts watching files.
 * When a change occurs to an `.astro` file, the checker
 */
class Checker {
	readonly #server: ViteDevServer;
	readonly #diagnosticsChecker: AstroCheck;
	readonly #shouldWatch: boolean;
	readonly #syncCli: (settings: AstroSettings, opts: SyncOptions) => Promise<ProcessExit>;

	readonly #settings: AstroSettings;

	readonly #logging: LogOptions;
	readonly #fs: typeof fsMod;

	#filesCount: number;
	#updateDiagnostics: NodeJS.Timeout | undefined;
	constructor({
		server,
		diagnosticChecker,
		watch,
		syncCli,
		settings,
		fileSystem,
		logging,
	}: CheckerConstructor) {
		this.#server = server;
		this.#diagnosticsChecker = diagnosticChecker;
		this.#shouldWatch = watch;
		this.#syncCli = syncCli;
		this.#logging = logging;
		this.#settings = settings;
		this.#fs = fileSystem;
		this.#filesCount = 0;
	}

	public async run(isWatchMode: boolean): Promise<CheckResult> {
		if (isWatchMode) {
			await this.#checkAll(isWatchMode);
			this.#watch();
			return CheckResult.Listen;
		} else {
			return await this.#checkAll(isWatchMode);
		}
	}

	async #checkAll(isWatchMode: boolean): Promise<CheckResult> {
		const processExit = await this.#syncCli(this.#settings, {
			logging: this.#logging,
			fs: this.#fs,
		});
		// early exit on sync failure
		if (processExit === 1) return processExit;

		let spinner = ora(
			` Getting diagnostics for Astro files in ${fileURLToPath(this.#settings.config.root)}…`
		).start();

		this.#filesCount = await openAllDocuments(
			this.#settings.config.root,
			[],
			this.#diagnosticsChecker
		);
		let diagnostics = await this.#diagnosticsChecker.getDiagnostics();

		spinner.succeed();

		let brokenDownDiagnostics = this.#breakDownDiagnostics(diagnostics);
		this.#logDiagnosticsSeverity(brokenDownDiagnostics);
		return brokenDownDiagnostics.errors > 0
			? CheckResult.ExitWithError
			: CheckResult.ExitWithSuccess;
	}

	#checkForDiagnostics() {
		clearTimeout(this.#updateDiagnostics);
		// @ematipico: I am not sure of `setTimeout`. I would rather use a debounce but let's see if this works.
		// Inspiration from `svelte-check`.
		this.#updateDiagnostics = setTimeout(async () => await this.#checkAll(true), 500);
	}

	/**
	 * This function is responsible to attach events to the server watcher
	 * @private
	 */
	#watch() {
		this.#server.watcher.on('add', (file) => {
			if (file.endsWith('.astro')) {
				this.#addDocument(file);
				this.#checkForDiagnostics();
			}
		});
		this.#server.watcher.on('change', (file) => {
			if (file.endsWith('.astro')) {
				this.#addDocument(file);
				this.#checkForDiagnostics();
			}
		});
		this.#server.watcher.on('unlink', (file) => {
			if (file.endsWith('.astro')) {
				this.#diagnosticsChecker.removeDocument(file);
				this.#filesCount -= 1;
				this.#checkForDiagnostics();
			}
		});
	}

	/**
	 * Add a document to the diagnostics checker
	 * @param file
	 * @private
	 */
	#addDocument(file: string) {
		const text = fs.readFileSync(file, 'utf-8');
		this.#diagnosticsChecker.upsertDocument({
			uri: pathToFileURL(file).toString(),
			text,
		});
		this.#filesCount += 1;
	}

	/**
	 * Logs the result of the various diagnostics
	 *
	 * @param {Readonly<DiagnosticResult>} result
	 */
	#logDiagnosticsSeverity(result: Readonly<DiagnosticResult>) {
		info(
			this.#logging,
			'diagnostics',
			[
				bold(`Result (${this.#filesCount} file${this.#filesCount === 1 ? '' : 's'}): `),
				bold(red(`${result.errors} ${result.errors === 1 ? 'error' : 'errors'}`)),
				bold(yellow(`${result.warnings} ${result.warnings === 1 ? 'warning' : 'warnings'}`)),
				dim(`${result.hints} ${result.hints === 1 ? 'hint' : 'hints'}\n`),
			].join(`\n${dim('-')} `)
		);
	}

	/**
	 * It loops through all diagnostics and break down diagnostics that are errors, warnings or hints.
	 * @param {Readonly<GetDiagnosticsResult[]>} diagnostics
	 */
	#breakDownDiagnostics(diagnostics: Readonly<GetDiagnosticsResult[]>): DiagnosticResult {
		let result: DiagnosticResult = {
			errors: 0,
			warnings: 0,
			hints: 0,
		};

		diagnostics.forEach((diag) => {
			diag.diagnostics.forEach((d) => {
				info(this.#logging, 'diagnostics', `\n ${printDiagnostic(diag.fileUri, diag.text, d)}`);

				switch (d.severity) {
					case DiagnosticSeverity.Error: {
						result.errors++;
						break;
					}
					case DiagnosticSeverity.Warning: {
						result.warnings++;
						break;
					}
					case DiagnosticSeverity.Hint: {
						result.hints++;
						break;
					}
				}
			});
		});

		return result;
	}
}

/**
 * Open all Astro files in the given directory and return the number of files found.*
 * @param {URL} workspaceUri
 * @param {string[]} filePathsToIgnore
 * @param {AstroCheck} checker
 */
async function openAllDocuments(
	workspaceUri: URL,
	filePathsToIgnore: string[],
	checker: AstroCheck
): Promise<number> {
	const files = await glob(ASTRO_GLOB_PATTERN, {
		cwd: fileURLToPath(workspaceUri),
		ignore: ['node_modules/**'].concat(filePathsToIgnore.map((ignore) => `${ignore}/**`)),
		absolute: true,
	});

	for (const file of files) {
		debug('check', `Adding file ${file} to the list of files to check.`);
		const text = fs.readFileSync(file, 'utf-8');
		checker.upsertDocument({
			uri: pathToFileURL(file).toString(),
			text,
		});
	}

	return files.length;
}

/**
 * Parse flags and sets defaults
 *
 * @param flags {Flags}
 */
function parseFlags(flags: Flags): CheckFlags {
	return {
		// TODO: https://github.com/withastro/roadmap/issues/473
		// Rename to `--watch` when the feature is stable
		watch: flags.experimentalWatch ?? false,
	};
}
