import { createRequire } from 'node:module';
import path from 'node:path';
import { AstroCheck } from '@astrojs/language-server';
import { watch } from 'chokidar';
import { bold, dim, red, yellow } from 'kleur/colors';
import mri from 'mri';
import { options } from './options.js';
import { isInIgnoredDirectory } from './watch.js';

type FlagValue<Option> = Option extends { type: 'boolean' }
	? boolean
	: Option extends { type: 'string' }
		? Option extends { default: undefined }
			? string | undefined
			: string
		: Option extends { choices: readonly (infer Choice)[] }
			? Choice
			: never;

export type Flags = {
	[Key in keyof typeof options]: FlagValue<(typeof options)[Key]>;
} & { help?: boolean };

function camelCase(option: string): string {
	return option.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function kebabCase(option: string): string {
	return option.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Given a list of arguments from the command line (such as `process.argv`), return parsed and processed options
 */
export function parseArgsAsCheckConfig(args: string[]): Flags {
	const entries = Object.entries(options);
	const boolean = entries.flatMap(([name, option]) =>
		'type' in option && option.type === 'boolean' ? [name, kebabCase(name)] : [],
	);
	boolean.push('help', 'h');
	const string = entries.flatMap(([name, option]) =>
		('type' in option && option.type === 'string') || 'choices' in option
			? [name, kebabCase(name)]
			: [],
	);
	const alias = Object.fromEntries([
		...entries.flatMap(([name, option]) => ('alias' in option ? [[option.alias, name]] : [])),
		['h', 'help'],
	]);
	const parsed = mri(args.slice(2), { boolean, string, alias });
	const flags = Object.fromEntries(
		Object.entries(parsed).map(([name, value]) => [camelCase(name), value]),
	);

	for (const [name, option] of entries) {
		if (flags[name] === undefined) flags[name] = option.default;
		if ('choices' in option && !option.choices.includes(flags[name])) {
			throw new Error(
				`Invalid value for --${kebabCase(name)}: ${String(flags[name])}. Expected one of: ${option.choices.join(', ')}.`,
			);
		}
	}

	return flags as Flags;
}

export async function check(flags: Partial<Flags> & { watch: true }): Promise<void>;
export async function check(flags: Partial<Flags> & { watch: false }): Promise<boolean>;
export async function check(flags: Partial<Flags>): Promise<boolean | void>;
/**
 * Print diagnostics according to the given flags, and return whether or not the program should exit with an error code.
 */
export async function check(flags: Partial<Flags>): Promise<boolean | void> {
	const workspaceRoot = path.resolve(flags.root ?? process.cwd());
	const require = createRequire(import.meta.url);
	const checker = new AstroCheck(workspaceRoot, require.resolve('typescript'), flags.tsconfig);

	let req = 0;

	if (flags.watch) {
		function createWatcher(rootPath: string, extensions: string[]) {
			return watch(rootPath, {
				ignored(pathStr, stats) {
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
		if (!flags.preserveWatchOutput) process.stdout.write('\x1Bc');
		await lint();
	}

	async function lint() {
		const currentReq = ++req;
		await new Promise((resolve) => setTimeout(resolve, 100));
		const isCanceled = () => currentReq !== req;
		if (isCanceled()) return;

		const minimumSeverity = flags.minimumSeverity || 'hint';
		const result = await checker.lint({
			logErrors: {
				level: minimumSeverity,
			},
			cancel: isCanceled,
		});
		console.info(
			[
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
				.join(`\n${dim('-')} `),
		);

		if (flags.watch) {
			console.info('Watching for changes...');
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
