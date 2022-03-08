/**
 * Dev server messages (organized here to prevent clutter)
 */

import type { AddressInfo } from 'net';
import { bold, dim, green, magenta, yellow, cyan } from 'kleur/colors';
import { pad, emoji } from './dev/util.js';

/** Display  */
export function req({ url, statusCode, reqTime }: { url: string; statusCode: number; reqTime?: number }): string {
	let color = dim;
	if (statusCode >= 500) color = magenta;
	else if (statusCode >= 400) color = yellow;
	else if (statusCode >= 300) color = dim;
	else if (statusCode >= 200) color = green;
	return `${color(statusCode)} ${pad(url, 40)} ${reqTime ? dim(Math.round(reqTime) + 'ms') : ''}`;
}

/** Display  */
export function reload({ url, reqTime }: { url: string; reqTime: number }): string {
	let color = yellow;
	return `${pad(url, 40)} ${dim(Math.round(reqTime) + 'ms')}`;
}

/** Display dev server host and startup time */
export function devStart({ startupTime, port, localAddress, networkAddress, https, site }: { startupTime: number; port: number; localAddress: string; networkAddress: string; https: boolean; site: URL | undefined }): string {
	// PACAKGE_VERSION is injected at build-time
	const pkgVersion = process.env.PACKAGE_VERSION;

	const rootPath = site ? site.pathname : '/';
	const toDisplayUrl = (hostname: string) => `${https ? 'https' : 'http'}://${hostname}:${port}${rootPath}`
	const messages = [
		``,
		`${emoji('🚀 ', '')}${magenta(`astro ${pkgVersion}`)} ${dim(`started in ${Math.round(startupTime)}ms`)}`,
		``,
		`Local:   ${bold(cyan(toDisplayUrl(localAddress)))}`,
		`Network: ${bold(cyan(toDisplayUrl(networkAddress)))}`,
		``,
	]
	return messages.join('\n')
}

/** Display dev server host */
export function devHost({ address, https, site }: { address: AddressInfo; https: boolean; site: URL | undefined }): string {
	const rootPath = site ? site.pathname : '/';
	const displayUrl = `${https ? 'https' : 'http'}://${address.address}:${address.port}${rootPath}`;
	return `Local: ${bold(magenta(displayUrl))}`;
}

/** Display port in use */
export function portInUse({ port }: { port: number }): string {
	return `Port ${port} in use. Trying a new one…`;
}
