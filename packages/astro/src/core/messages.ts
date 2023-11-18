import {
	bgGreen,
	bgRed,
	bgWhite,
	bgYellow,
	black,
	blue,
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
import { getDocsForError, renderErrorMarkdown } from './errors/dev/utils.js';
import {
	AstroError,
	AstroUserError,
	CompilerError,
	type ErrorWithMetadata,
} from './errors/index.js';
import { padMultilineString } from './util.js';

/** Display  */
export function req({
	url,
	method,
	statusCode,
	reqTime,
}: {
	url: string;
	statusCode: number;
	method?: string;
	reqTime?: number;
}): string {
	const color = statusCode >= 400 ? red : statusCode >= 300 ? yellow : blue;
	return (
		color(`[${statusCode}]`) +
		` ` +
		(method && method !== 'GET' ? color(method) + ' ' : '') +
		url +
		` ` +
		(reqTime ? dim(Math.round(reqTime) + 'ms') : '')
	);
}

/** Display server host and startup time */
export function serverStart({
	startupTime,
	resolvedUrls,
	host,
	base,
}: {
	startupTime: number;
	resolvedUrls: ResolvedServerUrls;
	host: string | boolean;
	base: string;
}): string {
	// PACKAGE_VERSION is injected at build-time
	const version = process.env.PACKAGE_VERSION ?? '0.0.0';
	const localPrefix = `${dim('┃')} Local    `;
	const networkPrefix = `${dim('┃')} Network  `;
	const emptyPrefix = ' '.repeat(11);

	const localUrlMessages = resolvedUrls.local.map((url, i) => {
		return `${i === 0 ? localPrefix : emptyPrefix}${cyan(new URL(url).origin + base)}`;
	});
	const networkUrlMessages = resolvedUrls.network.map((url, i) => {
		return `${i === 0 ? networkPrefix : emptyPrefix}${cyan(new URL(url).origin + base)}`;
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
		'',
		`${bgGreen(bold(` astro `))} ${green(`v${version}`)} ${dim(`ready in`)} ${Math.round(
			startupTime
		)} ${dim('ms')}`,
		'',
		...localUrlMessages,
		...networkUrlMessages,
		'',
	];
	return messages.filter((msg) => typeof msg === 'string').join('\n');
}

export function telemetryNotice() {
	const headline = blue(`▶ Astro collects anonymous usage data.`);
	const why = '  This information helps us improve Astro.';
	const disable = `  Run "astro telemetry disable" to opt-out.`;
	const details = `  ${cyan(underline('https://astro.build/telemetry'))}`;
	return [headline, why, disable, details].join('\n');
}

export function telemetryEnabled() {
	return [
		green('▶ Anonymous telemetry ') + bgGreen(' enabled '),
		`  Thank you for helping us improve Astro!`,
		``,
	].join('\n');
}

export function telemetryDisabled() {
	return [
		green('▶ Anonymous telemetry ') + bgGreen(' disabled '),
		`  Astro is no longer collecting anonymous usage data.`,
		``,
	].join('\n');
}

export function telemetryReset() {
	return [green('▶ Anonymous telemetry preferences reset.'), ``].join('\n');
}

export function fsStrictWarning() {
	const title = yellow('▶ ' + `${bold('vite.server.fs.strict')} has been disabled!`);
	const subtitle = `  Files on your machine are likely accessible on your network.`;
	return `${title}\n${subtitle}\n`;
}

export function prerelease({ currentVersion }: { currentVersion: string }) {
	const tag = currentVersion.split('-').slice(1).join('-').replace(/\..*$/, '') || 'unknown';
	const badge = bgYellow(black(` ${tag} `));
	const title = yellow('▶ ' + `This is a ${badge} prerelease build!`);
	const subtitle = `  Report issues here: ${cyan(underline('https://astro.build/issues'))}`;
	return `${title}\n${subtitle}\n`;
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
	const isOurError = AstroError.is(err) || CompilerError.is(err) || AstroUserError.is(err);

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
	const docsLink = getDocsForError(err);
	if (docsLink) {
		args.push(`  ${bold('Error reference:')}`);
		args.push(`    ${underline(docsLink)}`);
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
