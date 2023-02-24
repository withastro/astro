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
import { createServer } from 'vite';
import { createVite } from '../../core/create-vite.js';

interface Result {
	errors: number;
	// The language server cannot actually return any warnings at the moment, but we'll keep this here for future use
	warnings: number;
	hints: number;
}

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

enum CheckResult {
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
	if (checkFlags.watch) {
		info(logging, 'check', 'Checking files in watch mode');
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
			{ settings, logging, mode: 'build', fs }
		)
	);
	const { syncCli } = await import('../../core/sync/index.js');
	const processExit = await syncCli({ settings, logging, fs, viteServer });
	// early exit on sync failure
	if (processExit === 1) return processExit;

	const root = settings.config.root;

	let spinner = ora(` Getting diagnostics for Astro files in ${fileURLToPath(root)}…`).start();

	const require = createRequire(import.meta.url);
	let checker = new AstroCheck(
		root.toString(),
		require.resolve('typescript/lib/tsserverlibrary.js', { paths: [root.toString()] })
	);
	const filesCount = await openAllDocuments(root, [], checker);

	let diagnostics = await checker.getDiagnostics();

	spinner.succeed();

	let brokenDownDiagnostics = breakDownDiagnostics(logging, diagnostics);
	logDiagnosticsSeverity(logging, brokenDownDiagnostics, filesCount);

	if (checkFlags.watch) {
		let checkInProgress = false;
		viteServer.watcher.on('change', async (file, stats) => {
			debug('check', `Detected change for file ${file}`);
			// Vite file watcher seems to watch various files by default.
			// We use this trick to limit operations only on `.astro` files
			if (file.endsWith('astro') && !checkInProgress) {
				console.clear();
				checkInProgress = true;
				spinner = ora(` Getting diagnostics for Astro file ${file}`);
				await syncCli({ settings, logging, fs, viteServer });
				const text = fs.readFileSync(file, 'utf-8');
				checker.upsertDocument({
					uri: pathToFileURL(file).toString(),
					text,
				});
				checker.getDiagnostics().then((thisDiagnostics) => {
					spinner.succeed();
					brokenDownDiagnostics = breakDownDiagnostics(logging, thisDiagnostics);
					logDiagnosticsSeverity(logging, brokenDownDiagnostics, filesCount);
				});
				checkInProgress = false;
			}
		});
		return CheckResult.Listen;
	} else {
		return brokenDownDiagnostics.errors ? 1 : 0;
	}
}

type DiagnosticResult = {
	errors: number;
	warnings: number;
	hints: number;
};

/**
 * It loops through all diagnostics and counts diagnostics that are errors, warnings or hints.
 * @param {Readonly<LogOptions>} logging
 * @param {Readonly<GetDiagnosticsResult[]>} diagnostics
 */
function breakDownDiagnostics(
	logging: Readonly<LogOptions>,
	diagnostics: Readonly<GetDiagnosticsResult[]>
): DiagnosticResult {
	let result: DiagnosticResult = {
		errors: 0,
		warnings: 0,
		hints: 0,
	};

	diagnostics.forEach((diag) => {
		diag.diagnostics.forEach((d) => {
			info(logging, 'diagnostics', `\n ${printDiagnostic(diag.fileUri, diag.text, d)}`);

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

/**
 * Logs the result of the various diagnostics
 *
 * @param {Readonly<LogOptions>} logging
 * @param {Readonly<DiagnosticResult>} result
 * @param {number} filesCount
 */
function logDiagnosticsSeverity(
	logging: Readonly<LogOptions>,
	result: Readonly<DiagnosticResult>,
	filesCount: number
) {
	info(
		logging,
		'diagnostics',
		[
			bold(`Result (${filesCount} file${filesCount === 1 ? '' : 's'}): `),
			bold(red(`${result.errors} ${result.errors === 1 ? 'error' : 'errors'}`)),
			bold(yellow(`${result.warnings} ${result.warnings === 1 ? 'warning' : 'warnings'}`)),
			dim(`${result.hints} ${result.hints === 1 ? 'hint' : 'hints'}\n`),
		].join(`\n${dim('-')} `)
	);
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
		// Rename to `--watch` when feature is stable
		watch: flags.experimentalWatch ?? false,
	};
}
