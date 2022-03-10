/**
 * Dev server messages (organized here to prevent clutter)
 */

import type { AddressInfo } from 'net';
import stripAnsi from 'strip-ansi';
import { bold, dim, red, green, underline, yellow, bgYellow, cyan, bgGreen, black } from 'kleur/colors';
import { pad, emoji } from './dev/util.js';

const PREFIX_PADDING = 6;

/** Display  */
export function req({ url, statusCode, reqTime }: { url: string; statusCode: number; reqTime?: number }): string {
	let color = dim;
	if (statusCode >= 500) color = red;
	else if (statusCode >= 400) color = yellow;
	else if (statusCode >= 300) color = dim;
	else if (statusCode >= 200) color = green;
	return `${bold(color(pad(`${statusCode}`, PREFIX_PADDING)))} ${pad(url, 40)} ${reqTime ? dim(Math.round(reqTime) + 'ms') : ''}`.trim();
}

export function reload({ file }: { file: string }): string {
	return `${green(pad('reload', PREFIX_PADDING))} ${file}`;
}

export function hmr({ file }: { file: string }): string {
	return `${green(pad('update', PREFIX_PADDING))} ${file}`;
}

/** Display dev server host and startup time */
export function devStart({
	startupTime,
	port,
	localAddress,
	networkAddress,
	https,
	site,
}: {
	startupTime: number;
	port: number;
	localAddress: string;
	networkAddress: string;
	https: boolean;
	site: URL | undefined;
}): string {
	// PACAKGE_VERSION is injected at build-time
	const version = process.env.PACKAGE_VERSION ?? '0.0.0';
	const rootPath = site ? site.pathname : '/';
	const toDisplayUrl = (hostname: string) => `${https ? 'https' : 'http'}://${hostname}:${port}${rootPath}`;

	const messages = [
		`${emoji('🚀 ', '')}${bgGreen(black(` astro `))} ${green(`v${version}`)} ${dim(`started in ${Math.round(startupTime)}ms`)}`,
		'',
		`${dim('┃')} Local    ${bold(cyan(toDisplayUrl(localAddress)))}`,
		`${dim('┃')} Network  ${bold(cyan(toDisplayUrl(networkAddress)))}`,
		'',
	];
	return messages.map((msg) => `  ${msg}`).join('\n');
}

export function prerelease({ currentVersion }: { currentVersion: string }) {
	const tag = currentVersion.split('-').slice(1).join('-').replace(/\..*$/, '');
	const badge = bgYellow(black(` ${tag} `));
	const headline = yellow(`▶ This is a ${badge} prerelease build`);
	const warning = `  Feedback? ${underline('https://astro.build/issues')}`;
	return [headline, warning, ''].map((msg) => `  ${msg}`).join('\n');
}

/** Display port in use */
export function portInUse({ port }: { port: number }): string {
	return `Port ${port} in use. Trying a new one…`;
}

/** Pretty-print errors */
export function err(error: Error): string {
	if (!error.stack) return stripAnsi(error.message);
	let message = stripAnsi(error.message);
	let stack = stripAnsi(error.stack);
	const split = stack.indexOf(message) + message.length;
	message = stack.slice(0, split);
	stack = stack.slice(split).replace(/^\n+/, '');
	return `${message}\n${dim(stack)}`;
}
