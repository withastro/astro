import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AstroCheck } from '@astrojs/language-server';
import { watch } from 'chokidar';
import { bold, dim, red, yellow } from 'kleur/colors';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { options } from './options.js';
import { parseReportTargets, resolveReportTargets, type ReportOptions } from './report-options.js';
import { filterDiagnostics, formatReport } from './reporters.js';
import { isInIgnoredDirectory } from './watch.js';

/**
 * Given a list of arguments from the command line (such as `process.argv`), return parsed and processed options
 */
export function parseArgsAsCheckConfig(args: string[]) {
	const argv = hideBin(args);
	const parsed = yargs(argv).options(options).parseSync();
	const { reporter: _reporter, reporterFile: _reporterFile, ...config } = parsed;
	delete config['reporter-file'];
	return { ...config, reporters: parseReportTargets(argv) };
}

export type Flags = Pick<
	ReturnType<typeof parseArgsAsCheckConfig>,
	Exclude<keyof typeof options, 'reporter' | 'reporterFile'>
> &
	ReportOptions;

/** Whether any selected default reporter writes to stdout. */
export function hasDefaultReporter(flags: ReportOptions) {
	return resolveReportTargets(flags).some(
		(target) => target.reporter === 'default' && target.reporterFile === undefined,
	);
}

export async function check(flags: Partial<Flags> & { watch: true }): Promise<void>;
export async function check(flags: Partial<Flags> & { watch: false }): Promise<boolean>;
export async function check(flags: Partial<Flags>): Promise<boolean | void>;
/**
 * Print diagnostics according to the given flags, and return whether or not the program should exit with an error code.
 * Reject if the report options are invalid or the requested report file cannot be written.
 */
export async function check(flags: Partial<Flags>): Promise<boolean | void> {
	const reporters = resolveReportTargets(flags).map((target) => ({
		...target,
		reporterFile: target.reporterFile === undefined ? undefined : path.resolve(target.reporterFile),
	}));
	const hasDefaultStdout = reporters.some(
		(target) => target.reporter === 'default' && target.reporterFile === undefined,
	);
	const reportFiles = new Set(reporters.map((target) => target.reporterFile));
	const workspaceRoot = path.resolve(flags.root ?? process.cwd());
	const require = createRequire(import.meta.url);
	const checker = new AstroCheck(workspaceRoot, require.resolve('typescript'), flags.tsconfig);

	let req = 0;

	if (flags.watch) {
		function createWatcher(rootPath: string, extensions: string[]) {
			return watch(rootPath, {
				ignored(pathStr, stats) {
					if (reportFiles.has(path.resolve(pathStr))) return true;
					if (isInIgnoredDirectory(rootPath, pathStr)) return true;
					if (stats?.isFile() && !extensions.includes(path.extname(pathStr))) return true;
					return false;
				},
				ignoreInitial: true,
			});
		}

		// Dynamically get the list of extensions to watch from the files already included in the project
		const checkedExtensions = Array.from(
			new Set(checker.linter.getRootFileNames().map((fileName) => path.extname(fileName))),
		);
		createWatcher(workspaceRoot, checkedExtensions)
			.on('add', (fileName) => {
				checker.linter.fileCreated(fileName);
				update();
			})
			.on('unlink', (fileName) => {
				checker.linter.fileDeleted(fileName);
				update();
			})
			.on('change', (fileName) => {
				checker.linter.fileUpdated(fileName);
				update();
			});
	}

	async function update() {
		if (hasDefaultStdout && !flags.preserveWatchOutput) process.stdout.write('\x1Bc');
		await lint();
	}

	async function lint() {
		const currentReq = ++req;
		await new Promise((resolve) => setTimeout(resolve, 100));
		const isCanceled = () => currentReq !== req;
		if (isCanceled()) return;

		const minimumSeverity = flags.minimumSeverity || 'hint';
		const result = await checker.lint({
			logErrors: hasDefaultStdout ? { level: minimumSeverity } : undefined,
			cancel: isCanceled,
		});
		if (result.status !== 'completed' || isCanceled()) return;
		if (!hasDefaultStdout && reporters.some((target) => target.reporter === 'default')) {
			for (const file of result.fileResult) {
				file.text = checker.linter.printErrors(
					fileURLToPath(file.fileUrl),
					filterDiagnostics(file.errors, minimumSeverity),
				);
			}
		}
		const summary = [
			bold(`Result (${result.fileChecked} file${result.fileChecked === 1 ? '' : 's'}): `),
			['error', 'warning', 'hint'].includes(minimumSeverity)
				? result.errors > 0
					? bold(red(`${result.errors} ${result.errors === 1 ? 'error' : 'errors'}`))
					: dim('0 errors')
				: undefined,
			['warning', 'hint'].includes(minimumSeverity)
				? result.warnings > 0
					? bold(yellow(`${result.warnings} ${result.warnings === 1 ? 'warning' : 'warnings'}`))
					: dim('0 warnings')
				: undefined,
			['hint'].includes(minimumSeverity)
				? dim(`${result.hints} ${result.hints === 1 ? 'hint' : 'hints'}\n`)
				: undefined,
		]
			.filter(Boolean)
			.join(`\n${dim('-')} `);
		let defaultSummaryPrinted = false;
		for (const { reporter, reporterFile } of reporters) {
			if (isCanceled()) return;
			if (reporter === 'default' && reporterFile === undefined && !defaultSummaryPrinted) {
				console.info(summary);
				defaultSummaryPrinted = true;
				continue;
			}
			const report = formatReport(result, {
				reporter,
				root: workspaceRoot,
				summary,
				minimumSeverity,
				minimumFailingSeverity: flags.minimumFailingSeverity ?? 'error',
			});
			if (reporterFile === undefined) {
				await new Promise<void>((resolve, reject) => {
					process.stdout.write(report, (error) => (error ? reject(error) : resolve()));
				});
				continue;
			}
			try {
				mkdirSync(path.dirname(reporterFile), { recursive: true });
				writeFileSync(reporterFile, report, 'utf8');
			} catch (error) {
				throw new Error(`Unable to write diagnostic report to "${reporterFile}": ${error}`);
			}
		}

		if (flags.watch) {
			if (hasDefaultStdout && !isCanceled()) console.info('Watching for changes...');
		} else {
			switch (flags.minimumFailingSeverity) {
				case 'error':
					return result.errors > 0;
				case 'warning':
					return result.errors + result.warnings > 0;
				case 'hint':
					return result.errors + result.warnings + result.hints > 0;
				case undefined:
				default:
					return result.errors > 0;
			}
		}
	}

	// Always lint on first run, even in watch mode.
	const lintResult = await lint();
	if (!flags.watch) return lintResult;
}
