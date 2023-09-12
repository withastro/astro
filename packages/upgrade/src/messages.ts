/* eslint no-console: 'off' */
import { color, label, spinner as load } from '@astrojs/cli-kit';
import detectPackageManager from 'which-pm-runs';
import { shell } from './shell.js';

// Users might lack access to the global npm registry, this function
// checks the user's project type and will return the proper npm registry
//
// A copy of this function also exists in the astro package
export async function getRegistry(): Promise<string> {
	const packageManager = detectPackageManager()?.name || 'npm';
	try {
		const { stdout } = await shell(packageManager, ['config', 'get', 'registry']);
		return stdout?.trim()?.replace(/\/$/, '') || 'https://registry.npmjs.org';
	} catch (e) {
		return 'https://registry.npmjs.org';
	}
}

let stdout = process.stdout;
/** @internal Used to mock `process.stdout.write` for testing purposes */
export function setStdout(writable: typeof process.stdout) {
	stdout = writable;
}

export async function spinner(args: {
	start: string;
	end: string;
	while: (...args: any) => Promise<any>;
}) {
	await load(args, { stdout });
}

export const celebrations = [
	'Beautiful.',
	'Excellent!',
	'Sweet!',
	'Nice!',
	'Huzzah!',
	'Success.',
	'Nice.',
	'Wonderful.',
	'Lovely!',
	'Lookin\' good.',
	'Awesome.'
]

export const done = [
	'You\'re on the latest and greatest.',
	'Everything is current.',
	'Integrations are all up to date.',
	'All done. Thanks for using Astro!',
	'Integrations up to date. Enjoy building!',
	'All set, everything is up to date.',
]

export const log = (message: string) => stdout.write(message + '\n');
export const banner = async () =>
	log(
		`\n${label('astro', color.bgGreen, color.black)}  ${color.bold('Integration upgrade in progress.')}`
	);

export const bannerAbort = () =>
	log(`\n${label('astro', color.bgRed)} ${color.bold('Launch sequence aborted.')}`);

export const info = async (prefix: string, text: string, version = '') => {
	const length = 11 + prefix.length + text.length + version?.length;
	if (length > stdout.columns) {
		log(`${' '.repeat(5)} ${color.cyan('◼')}  ${prefix}`);
		log(`${' '.repeat(9)}${color.dim(text)} ${color.reset(version)}`);
	} else {
		log(`${' '.repeat(5)} ${color.cyan('◼')}  ${prefix} ${color.dim(text)} ${color.reset(version)}`);
	}
}
export const upgrade = async (prefix: string, text: string, version = '') => {
	const length = 11 + prefix.length + text.length + version.length;
	if (length > stdout.columns) {
		log(`${' '.repeat(5)} ${color.magenta('▲')}  ${prefix}`);
		log(`${' '.repeat(9)}${color.dim(text)} ${color.magenta(version)}`);
	} else {
		log(`${' '.repeat(5)} ${color.magenta('▲')}  ${prefix} ${color.dim(text)} ${color.magenta(version)}`);
	}
}

export const success = async (prefix: string, text: string) => {
	const length = 10 + prefix.length + text.length;
	if (length > stdout.columns) {
		log(`${' '.repeat(5)} ${color.green("✔")}  ${prefix}`);
		log(`${' '.repeat(9)}${color.dim(text)}`);
	} else {
		log(`${' '.repeat(5)} ${color.green("✔")}  ${prefix} ${color.dim(text)}`);
	}
};

export const error = async (prefix: string, text: string) => {
	if (stdout.columns < 80) {
		log(`${' '.repeat(5)} ${color.red('▲')}  ${color.red(prefix)}`);
		log(`${' '.repeat(9)}${color.dim(text)}`);
	} else {
		log(`${' '.repeat(5)} ${color.red('▲')}  ${color.red(prefix)} ${color.dim(text)}`);
	}
};

export function printHelp({
	commandName,
	usage,
	tables,
	description,
}: {
	commandName: string;
	headline?: string;
	usage?: string;
	tables?: Record<string, [command: string, help: string][]>;
	description?: string;
}) {
	const linebreak = () => '';
	const table = (rows: [string, string][], { padding }: { padding: number }) => {
		const split = stdout.columns < 60;
		let raw = '';

		for (const row of rows) {
			if (split) {
				raw += `    ${row[0]}\n    `;
			} else {
				raw += `${`${row[0]}`.padStart(padding)}`;
			}
			raw += '  ' + color.dim(row[1]) + '\n';
		}

		return raw.slice(0, -1); // remove latest \n
	};

	let message = [];

	if (usage) {
		message.push(linebreak(), `${color.green(commandName)} ${color.bold(usage)}`);
	}

	if (tables) {
		function calculateTablePadding(rows: [string, string][]) {
			return rows.reduce((val, [first]) => Math.max(val, first.length), 0);
		}
		const tableEntries = Object.entries(tables);
		const padding = Math.max(...tableEntries.map(([, rows]) => calculateTablePadding(rows)));
		for (const [, tableRows] of tableEntries) {
			message.push(linebreak(), table(tableRows, { padding }));
		}
	}

	if (description) {
		message.push(linebreak(), `${description}`);
	}

	log(message.join('\n') + '\n');
}
