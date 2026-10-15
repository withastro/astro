import type { AddressInfo } from 'node:net';

/**
 * Builds the origin to fetch a server on from the address it actually bound.
 *
 * Deliberately takes the bound {@link AddressInfo} rather than a hostname: resolving a
 * name a second time, independently of the resolution `listen()` used, can pick a
 * different address family, leaving the server on `::1` while `fetch()` dials
 * `127.0.0.1`. IPv6 literals are bracketed per RFC 2732.
 */
export function buildServerUrl(address: AddressInfo): string {
	const host = address.family === 'IPv6' ? `[${address.address}]` : address.address;
	return `http://${host}:${address.port}`;
}
