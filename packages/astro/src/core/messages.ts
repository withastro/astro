/**
 * Dev server messages (organized here to prevent clutter)
 */

import type { AddressInfo } from 'net';
import { bold, dim, green, magenta, yellow } from 'kleur/colors';
import { pad } from './dev/util.js';

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
export function devStart({ startupTime }: { startupTime: number }): string {
	return `${pad(`Server started`, 44)} ${dim(`${Math.round(startupTime)}ms`)}`;
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
