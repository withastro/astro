import colors from 'piccolore';
import type { ResolvedServerUrls } from 'vite';
import type { $ZodError } from 'zod/v4/core';
import { partitionByKind } from '@astrojs/vite-plugin-router/_internal/core/csp/runtime.js';
import { renderErrorMarkdown } from '@astrojs/vite-plugin-router/_internal/core/errors/dev/runtime.js';
export { formatErrorMessage } from '@astrojs/vite-plugin-router/_internal/core/messages/error.js';
export { req } from '@astrojs/vite-plugin-router/_internal/core/messages/request.js';
import type { AstroVersionProvider, TextStyler } from '../../cli/definitions.js';
import type { AstroConfig } from '../../types/public/index.js';
import type { AstroLogger } from '@astrojs/vite-plugin-router/_internal/core/logger/core.js';

const {
	bgGreen,
	bgYellow,
	bgCyan,
	bgWhite,
	black,
	blue,
	bold,
	cyan,
	dim,
	green,
	red,
	underline,
	yellow,
} = colors;

/**
 * Prestyled messages for the CLI. Used by astro CLI commands.
 */

/** Display server host and startup time */
export function serverStart({
	startupTime,
	resolvedUrls,
	host,
	base,
	astroVersionProvider,
	textStyler,
}: {
	startupTime: number;
	resolvedUrls: ResolvedServerUrls;
	host: string | boolean;
	base: string;
	astroVersionProvider: AstroVersionProvider;
	textStyler: TextStyler;
}): string {
	const localPrefix = `${textStyler.dim('┃')} Local    `;
	const networkPrefix = `${textStyler.dim('┃')} Network  `;
	const emptyPrefix = ' '.repeat(11);

	const localUrlMessages = resolvedUrls.local.map((url, i) => {
		return `${i === 0 ? localPrefix : emptyPrefix}${textStyler.cyan(new URL(url).origin + base)}`;
	});
	const networkUrlMessages = resolvedUrls.network.map((url, i) => {
		return `${i === 0 ? networkPrefix : emptyPrefix}${textStyler.cyan(new URL(url).origin + base)}`;
	});

	if (networkUrlMessages.length === 0) {
		const networkLogging = getNetworkLogging(host);
		if (networkLogging === 'host-to-expose') {
			networkUrlMessages.push(`${networkPrefix}${textStyler.dim('use --host to expose')}`);
		} else if (networkLogging === 'visible') {
			networkUrlMessages.push(
				`${networkPrefix}${textStyler.dim('unable to find network to expose')}`,
			);
		}
	}

	const messages = [
		'',
		`${textStyler.bgGreen(textStyler.bold(` astro `))} ${textStyler.green(`v${astroVersionProvider.version}`)} ${textStyler.dim(`ready in`)} ${Math.round(
			startupTime,
		)} ${textStyler.dim('ms')}`,
		'',
		...localUrlMessages,
		...networkUrlMessages,
		'',
	];
	return messages.filter(Boolean).join('\n');
}

/** Display custom dev server shortcuts */
export function serverShortcuts({ key, label }: { key: string; label: string }): string {
	return [dim('  Press'), key, dim('to'), label].join(' ');
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

export function preferenceEnabled(name: string) {
	return `${green('◉')} ${name} is now ${bgGreen(black(' enabled '))}\n`;
}

export function preferenceSet(name: string, value: any) {
	return `${green('◉')} ${name} has been set to ${bgGreen(black(` ${JSON.stringify(value)} `))}\n`;
}

export function preferenceGet(name: string, value: any) {
	return `${green('◉')} ${name} is set to ${bgGreen(black(` ${JSON.stringify(value)} `))}\n`;
}

export function preferenceDefaultIntro(name: string) {
	return `${yellow('◯')} ${name} has not been set. It defaults to\n`;
}

export function preferenceDefault(name: string, value: any) {
	return `${yellow('◯')} ${name} has not been set. It defaults to ${bgYellow(
		black(` ${JSON.stringify(value)} `),
	)}\n`;
}

export function preferenceDisabled(name: string) {
	return `${yellow('◯')} ${name} is now ${bgYellow(black(' disabled '))}\n`;
}

export function preferenceReset(name: string) {
	return `${cyan('◆')} ${name} has been ${bgCyan(black(' reset '))}\n`;
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

export function actionRequired(message: string) {
	const badge = bgYellow(black(` action required `));
	const headline = yellow(message);
	return ['', `${badge} ${headline}`]
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

function getNetworkLogging(host: string | boolean): 'none' | 'host-to-expose' | 'visible' {
	if (host === false) {
		return 'host-to-expose';
	} else if (typeof host === 'string' && LOCAL_IP_HOSTS.has(host)) {
		return 'none';
	} else {
		return 'visible';
	}
}

const codeRegex = /`([^`]+)`/g;

export function formatConfigErrorMessage(err: $ZodError) {
	const errorList = err.issues.map((issue) =>
		`! ${renderErrorMarkdown(issue.message, 'cli')}`
			// Make text wrapped in backticks blue.
			.replaceAll(codeRegex, blue('$1'))
			// Make the first line red and indent the rest.
			.split('\n')
			.map((line, index) => (index === 0 ? red(line) : '  ' + line))
			.join('\n'),
	);
	return `${red('[config]')} Astro found issue(s) with your configuration:\n\n${errorList.join(
		'\n\n',
	)}`;
}

/** @deprecated Migrate to HelpDisplay */
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
				`v${process.env.PACKAGE_VERSION ?? ''}`,
			)} ${headline}`,
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

	// biome-ignore lint/suspicious/noConsole: allowed
	console.log(message.join('\n') + '\n');
}

export function warnIfCspWithShiki(config: AstroConfig, logger: AstroLogger): void {
	// Check if CSP is enabled
	const cspEnabled = config.security.csp !== false;
	if (!cspEnabled) return;

	// Check if Shiki is being used (string or object form)
	const syntaxHighlight = config.markdown.syntaxHighlight;
	const isShiki =
		syntaxHighlight === 'shiki' ||
		(typeof syntaxHighlight === 'object' && syntaxHighlight?.type === 'shiki');

	if (isShiki) {
		logger.warn(
			'config',
			'Shiki syntax highlighting uses inline styles that are not compatible with Content Security Policy (CSP). ' +
				'Consider using Prism syntax highlighting instead, or disable CSP if Shiki is required.',
		);
	}
}

/**
 * Warns when a `scriptDirective`/`styleDirective` defines `default`-kind resources alongside
 * `element`/`attribute`-kind entries. Because the more specific directive (`*-src-elem`/`*-src-attr`)
 * overrides the generic one for its scope and browsers do not fall back, the generic resources will
 * not apply there. Astro's generated hashes are folded automatically, so this only concerns
 * user-provided resources.
 */
export function warnIfCspResourceFallbackShadowing(config: AstroConfig, logger: AstroLogger): void {
	const csp = config.security.csp;
	// Only the object form has `scriptDirective`/`styleDirective` to inspect. (Reading the config
	// directly here keeps this module free of the Node-only `csp/common.js`, which must not leak
	// into the SSR runtime.)
	if (typeof csp !== 'object') return;

	const families = [
		{ name: 'script', directive: csp.scriptDirective },
		{ name: 'style', directive: csp.styleDirective },
	] as const;

	for (const { name, directive } of families) {
		const sources = partitionByKind({
			resources: directive?.resources ?? [],
			hashes: directive?.hashes ?? [],
		});
		if (sources.default.resources.length === 0) continue;
		const shadowed: string[] = [];
		if (sources.element.resources.length > 0 || sources.element.hashes.length > 0) {
			shadowed.push(`\`${name}-src-elem\``);
		}
		if (sources.attribute.resources.length > 0 || sources.attribute.hashes.length > 0) {
			shadowed.push(`\`${name}-src-attr\``);
		}
		if (shadowed.length === 0) continue;

		logger.warn(
			'csp',
			`\`security.csp.${name}Directive\` defines \`${name}-src\` resources (${sources.default.resources.join(
				' ',
			)}) as well as ${shadowed.join(' and ')} resources or hashes. Because ${shadowed.join(
				' and ',
			)} override \`${name}-src\` for their scope (browsers do not fall back), those \`${name}-src\` resources will not apply there. Add them to the corresponding \`kind\` if needed.`,
		);
	}
}
