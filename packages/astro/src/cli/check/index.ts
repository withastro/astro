import {
	AstroCheck,
	DiagnosticSeverity,
	type GetDiagnosticsResult,
} from '@astrojs/language-server';
import type { FSWatcher } from 'chokidar';
import glob from 'fast-glob';
import fs from 'fs';
import { bold, dim, red, yellow } from 'kleur/colors';
import { createRequire } from 'module';
import { join } from 'node:path';
import ora from 'ora';
import { fileURLToPath, pathToFileURL } from 'url';
import type { Arguments as Flags } from 'yargs-parser';
import type { AstroSettings } from '../../@types/astro';
import type { LogOptions } from '../../core/logger/core.js';
import { debug, info } from '../../core/logger/core.js';
import { printHelp } from '../../core/messages.js';
import type { ProcessExit, SyncOptions } from '../../core/sync';
import { printDiagnostic } from './print.js';

type DiagnosticResult = {
	errors: number;
	warnings: number;
	hints: number;
};

export type CheckPayload = {
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

/**
 *
 * Types of response emitted by the checker
 */
export enum CheckResult {
	/**
	 * Operation finished without errors
	 */
	ExitWithSuccess,
	/**
	 * Operation finished with errors
	 */
	ExitWithError,
	/**
	 * The consumer should not terminate the operation
	 */
	Listen,
}

const ASTRO_GLOB_PATTERN = '**/*.astro';

/**
 * Checks `.astro` files for possible errors.
 *
 * If the `--watch` flag is provided, the command runs indefinitely and provides diagnostics
 * when `.astro` files are modified.
 *
 * Every time an astro files is modified, content collections are also generated.
 *
 * @param {AstroSettings} settings
 * @param {CheckPayload} options Options passed {@link AstroChecker}
 * @param {Flags} options.flags Flags coming from the CLI
 * @param {LogOptions} options.logging Logging options
 */
export async function check(
	settings: AstroSettings,
	{ logging, flags }: CheckPayload
): Promise<AstroChecker | undefined> {
	if (flags.help || flags.h) {
		printHelp({
			commandName: 'astro check',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--watch', 'Watch Astro files for changes and re-run checks.'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Runs diagnostics against your project and reports errors to the console.`,
		});
		return;
	}
	const checkFlags = parseFlags(flags);
	if (checkFlags.watch) {
		info(logging, 'check', 'Checking files in watch mode');
	} else {
		info(logging, 'check', 'Checking files');
	}

	const { syncCli } = await import('../../core/sync/index.js');
	const root = settings.config.root;
	const require = createRequire(import.meta.url);
	const diagnosticChecker = new AstroCheck(
		root.toString(),
		require.resolve('typescript/lib/tsserverlibrary.js', {
			paths: [root.toString()],
		})
	);

	return new AstroChecker({
		syncCli,
		settings,
		fileSystem: fs,
		logging,
		diagnosticChecker,
		isWatchMode: checkFlags.watch,
	});
}

type CheckerConstructor = {
	diagnosticChecker: AstroCheck;

	isWatchMode: boolean;

	syncCli: (settings: AstroSettings, options: SyncOptions) => Promise<ProcessExit>;

	settings: Readonly<AstroSettings>;

	logging: Readonly<LogOptions>;

	fileSystem: typeof fs;
};

/**
 * Responsible to check files - classic or watch mode - and report diagnostics.
 *
 * When in watch mode, the class does a whole check pass, and then starts watching files.
 * When a change occurs to an `.astro` file, the checker builds content collections again and lint all the `.astro` files.
 */
export class AstroChecker {
	readonly #diagnosticsChecker: AstroCheck;
	readonly #shouldWatch: boolean;
	readonly #syncCli: (settings: AstroSettings, opts: SyncOptions) => Promise<ProcessExit>;

	readonly #settings: AstroSettings;

	readonly #logging: LogOptions;
	readonly #fs: typeof fs;
	#watcher?: FSWatcher;

	#filesCount: number;
	#updateDiagnostics: NodeJS.Timeout | undefined;

	constructor({
		diagnosticChecker,
		isWatchMode,
		syncCli,
		settings,
		fileSystem,
		logging,
	}: CheckerConstructor) {
		this.#diagnosticsChecker = diagnosticChecker;
		this.#shouldWatch = isWatchMode;
		this.#syncCli = syncCli;
		this.#logging = logging;
		this.#settings = settings;
		this.#fs = fileSystem;
		this.#filesCount = 0;
	}

	/**
	 * Check all `.astro` files once and then finishes the operation.
	 */
	public async check(): Promise<CheckResult> {
		return await this.#checkAllFiles(true);
	}

	/**
	 * Check all `.astro` files and then start watching for changes.
	 */
	public async watch(): Promise<CheckResult> {
		await this.#checkAllFiles(true);
		await this.#watch();
		return CheckResult.Listen;
	}

	/**
	 * Stops the watch. It terminates the inner server.
	 */
	public async stop() {
		await this.#watcher?.close();
	}

	/**
	 * Whether the checker should run in watch mode
	 */
	public get isWatchMode(): boolean {
		return this.#shouldWatch;
	}

	async #openDocuments() {
		this.#filesCount = await openAllDocuments(
			this.#settings.config.root,
			[],
			this.#diagnosticsChecker
		);
	}

	/**
	 * Lint all `.astro` files, and report the result in console. Operations executed, in order:
	 * 1. Compile content collections.
	 * 2. Optionally, traverse the file system for `.astro` files and saves their paths.
	 * 3. Get diagnostics for said files and print the result in console.
	 *
	 * @param openDocuments Whether the operation should open all `.astro` files
	 */
	async #checkAllFiles(openDocuments: boolean): Promise<CheckResult> {
		const processExit = await this.#syncCli(this.#settings, {
			logging: this.#logging,
			fs: this.#fs,
		});
		// early exit on sync failure
		if (processExit === 1) return processExit;

		let spinner = ora(
			` Getting diagnostics for Astro files in ${fileURLToPath(this.#settings.config.root)}…`
		).start();

		if (openDocuments) {
			await this.#openDocuments();
		}

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
		this.#updateDiagnostics = setTimeout(async () => await this.#checkAllFiles(false), 500);
	}

	/**
	 * This function is responsible to attach events to the server watcher
	 */
	async #watch() {
		const { default: chokidar } = await import('chokidar');
		this.#watcher = chokidar.watch(
			join(fileURLToPath(this.#settings.config.root), ASTRO_GLOB_PATTERN),
			{
				ignored: ['**/node_modules/**'],
				ignoreInitial: true,
			}
		);

		this.#watcher.on('add', (file) => {
			this.#addDocument(file);
			this.#filesCount += 1;
			this.#checkForDiagnostics();
		});
		this.#watcher.on('change', (file) => {
			this.#addDocument(file);
			this.#checkForDiagnostics();
		});
		this.#watcher.on('unlink', (file) => {
			this.#diagnosticsChecker.removeDocument(file);
			this.#filesCount -= 1;
			this.#checkForDiagnostics();
		});
	}

	/**
	 * Add a document to the diagnostics checker
	 * @param filePath Path to the file
	 */
	#addDocument(filePath: string) {
		const text = fs.readFileSync(filePath, 'utf-8');
		this.#diagnosticsChecker.upsertDocument({
			uri: pathToFileURL(filePath).toString(),
			text,
		});
	}

	/**
	 * Logs the result of the various diagnostics
	 *
	 * @param result Result emitted by AstroChecker.#breakDownDiagnostics
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
 * Open all Astro files in the given directory and return the number of files found.
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
 */
function parseFlags(flags: Flags): CheckFlags {
	return {
		watch: flags.watch ?? false,
	};
}
