import boxen from 'boxen';
import {
	bgCyan,
	bgGreen,
	bgRed,
	bgWhite,
	bgYellow,
	black,
	bold,
	cyan,
	dim,
	green,
	red,
	underline,
	yellow,
} from 'kleur/colors';
import type { ResolvedServerUrls } from 'vite';
import type { ZodError } from 'zod';
import { renderErrorMarkdown } from './errors/dev/utils.js';
import { AstroError, CompilerError, ErrorWithMetadata } from './errors/index.js';
import { emoji, padMultilineString } from './util.js';

const PREFIX_PADDING = 6;

/** Display  */
export function req({
	url,
	statusCode,
	reqTime,
}: {
	url: string;
	statusCode: number;
	reqTime?: number;
}): string {
	let color = dim;
	if (statusCode >= 500) color = red;
	else if (statusCode >= 400) color = yellow;
	else if (statusCode >= 300) color = dim;
	else if (statusCode >= 200) color = green;
	return `${bold(color(`${statusCode}`.padStart(PREFIX_PADDING)))} ${url.padStart(40)} ${
		reqTime ? dim(Math.round(reqTime) + 'ms') : ''
	}`.trim();
}

export function reload({ file }: { file: string }): string {
	return `${green('reload'.padStart(PREFIX_PADDING))} ${file}`;
}

export function hmr({ file, style = false }: { file: string; style?: boolean }): string {
	return `${green('update'.padStart(PREFIX_PADDING))} ${file}${style ? ` ${dim('style')}` : ''}`;
}

/** Display server host and startup time */
export function serverStart({
	startupTime,
	resolvedUrls,
	host,
	base,
	isRestart = false,
}: {
	startupTime: number;
	resolvedUrls: ResolvedServerUrls;
	host: string | boolean;
	base: string;
	isRestart?: boolean;
}): string {
	// PACKAGE_VERSION is injected at build-time
	const version = process.env.PACKAGE_VERSION ?? '0.0.0';
	const localPrefix = `${dim('┃')} Local    `;
	const networkPrefix = `${dim('┃')} Network  `;
	const emptyPrefix = ' '.repeat(11);

	const localUrlMessages = resolvedUrls.local.map((url, i) => {
		return `${i === 0 ? localPrefix : emptyPrefix}${bold(cyan(new URL(url).origin + base))}`;
	});
	const networkUrlMessages = resolvedUrls.network.map((url, i) => {
		return `${i === 0 ? networkPrefix : emptyPrefix}${bold(cyan(new URL(url).origin + base))}`;
	});

	if (networkUrlMessages.length === 0) {
		const networkLogging = getNetworkLogging(host);
		if (networkLogging === 'host-to-expose') {
			networkUrlMessages.push(`${networkPrefix}${dim('use --host to expose')}`);
		} else if (networkLogging === 'visible') {
			networkUrlMessages.push(`${networkPrefix}${dim('unable to find network to expose')}`);
		}
	}

	const messages = [
		`${emoji('🚀 ', '')}${bgGreen(black(` astro `))} ${green(`v${version}`)} ${dim(
			`${isRestart ? 're' : ''}started in ${Math.round(startupTime)}ms`
		)}`,
		'',
		...localUrlMessages,
		...networkUrlMessages,
		'',
	];
	return messages
		.filter((msg) => typeof msg === 'string')
		.map((msg) => `  ${msg}`)
		.join('\n');
}

export function telemetryNotice() {
	const headline = yellow(`Astro now collects ${bold('anonymous')} usage data.`);
	const why = `This ${bold('optional program')} will help shape our roadmap.`;
	const more = `For more info, visit ${underline('https://astro.build/telemetry')}`;
	const box = boxen([headline, why, '', more].join('\n'), {
		margin: 0,
		padding: 1,
		borderStyle: 'round',
		borderColor: 'yellow',
	});
	return box;
}

export function telemetryEnabled() {
	return `\n  ${green('◉')} Anonymous telemetry is ${bgGreen(
		black(' enabled ')
	)}. Thank you for improving Astro!\n`;
}

export function telemetryDisabled() {
	return `\n  ${yellow('◯')}  Anonymous telemetry is ${bgYellow(
		black(' disabled ')
	)}. We won't share any usage data.\n`;
}

export function telemetryReset() {
	return `\n  ${cyan('◆')} Anonymous telemetry has been ${bgCyan(
		black(' reset ')
	)}. You may be prompted again.\n`;
}

export function fsStrictWarning() {
	return yellow(
		'⚠️ Serving with vite.server.fs.strict: false. Note that all files on your machine will be accessible to anyone on your network!'
	);
}

export function prerelease({ currentVersion }: { currentVersion: string }) {
	const tag = currentVersion.split('-').slice(1).join('-').replace(/\..*$/, '');
	const badge = bgYellow(black(` ${tag} `));
	const headline = yellow(`▶ This is a ${badge} prerelease build`);
	const warning = `  Feedback? ${underline('https://astro.build/issues')}`;
	return [headline, warning, ''].map((msg) => `  ${msg}`).join('\n');
}

export function success(message: string, tip?: string) {
	const badge = bgGreen(black(` success `));
	const headline = green(message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

export function failure(message: string, tip?: string) {
	const badge = bgRed(black(` error `));
	const headline = red(message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

export function cancelled(message: string, tip?: string) {
	const badge = bgYellow(black(` cancelled `));
	const headline = yellow(message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

const LOCAL_IP_HOSTS = new Set(['localhost', '127.0.0.1']);

export function getNetworkLogging(host: string | boolean): 'none' | 'host-to-expose' | 'visible' {
	if (host === false) {
		return 'host-to-expose';
	} else if (typeof host === 'string' && LOCAL_IP_HOSTS.has(host)) {
		return 'none';
	} else {
		return 'visible';
	}
}

export function formatConfigErrorMessage(err: ZodError) {
	const errorList = err.issues.map(
		(issue) => `  ! ${bold(issue.path.join('.'))}  ${red(issue.message + '.')}`
	);
	return `${red('[config]')} Astro found issue(s) with your configuration:\n${errorList.join(
		'\n'
	)}`;
}

export function formatErrorMessage(err: ErrorWithMetadata, args: string[] = []): string {
	const isOurError = AstroError.is(err) || CompilerError.is(err);

	args.push(
		`${bgRed(black(` error `))}${red(
			padMultilineString(isOurError ? renderErrorMarkdown(err.message, 'cli') : err.message)
		)}`
	);
	if (err.hint) {
		args.push(`  ${bold('Hint:')}`);
		args.push(
			yellow(padMultilineString(isOurError ? renderErrorMarkdown(err.hint, 'cli') : err.hint, 4))
		);
	}
	if (err.id || err.loc?.file) {
		args.push(`  ${bold('File:')}`);
		args.push(
			red(
				`    ${err.id ?? err.loc?.file}${
					err.loc?.line && err.loc.column ? `:${err.loc.line}:${err.loc.column}` : ''
				}`
			)
		);
	}
	if (err.frame) {
		args.push(`  ${bold('Code:')}`);
		args.push(red(padMultilineString(err.frame.trim(), 4)));
	}
	if (args.length === 1 && err.stack) {
		args.push(dim(err.stack));
	} else if (err.stack) {
		args.push(`  ${bold('Stacktrace:')}`);
		args.push(dim(err.stack));
		args.push(``);
	}

	if (err.cause) {
		args.push(`  ${bold('Cause:')}`);
		if (err.cause instanceof Error) {
			args.push(dim(err.cause.stack ?? err.cause.toString()));
		} else {
			args.push(JSON.stringify(err.cause));
		}

		args.push(``);
	}
	return args.join('\n');
}

export function printHelp({
	commandName,
	headline,
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
	const title = (label: string) => `  ${bgWhite(black(` ${label} `))}`;
	const table = (rows: [string, string][], { padding }: { padding: number }) => {
		const split = process.stdout.columns < 60;
		let raw = '';

		for (const row of rows) {
			if (split) {
				raw += `    ${row[0]}\n    `;
			} else {
				raw += `${`${row[0]}`.padStart(padding)}`;
			}
			raw += '  ' + dim(row[1]) + '\n';
		}

		return raw.slice(0, -1); // remove latest \n
	};

	let message = [];

	if (headline) {
		message.push(
			linebreak(),
			`  ${bgGreen(black(` ${commandName} `))} ${green(
				`v${process.env.PACKAGE_VERSION ?? ''}`
			)} ${headline}`
		);
	}

	if (usage) {
		message.push(linebreak(), `  ${green(commandName)} ${bold(usage)}`);
	}

	if (tables) {
		function calculateTablePadding(rows: [string, string][]) {
			return rows.reduce((val, [first]) => Math.max(val, first.length), 0) + 2;
		}
		const tableEntries = Object.entries(tables);
		const padding = Math.max(...tableEntries.map(([, rows]) => calculateTablePadding(rows)));
		for (const [tableTitle, tableRows] of tableEntries) {
			message.push(linebreak(), title(tableTitle), table(tableRows, { padding }));
		}
	}

	if (description) {
		message.push(linebreak(), `${description}`);
	}

	// eslint-disable-next-line no-console
	console.log(message.join('\n') + '\n');
}
