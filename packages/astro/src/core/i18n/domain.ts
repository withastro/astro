import {
	appendForwardSlash,
	collapseDuplicateLeadingSlashes,
	joinPaths,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { normalizeTheLocale } from '../../i18n/path.js';
import type { SSRManifest } from '../app/types.js';
import type { AstroLogger } from '../logger/core.js';

/**
 * The i18n strategies that derive the request's locale from its domain (the
 * `Host` header) rather than the URL pathname. `BaseApp` gates its
 * Host-header pathname probe on this predicate, and `computePathnameFromDomain`
 * only acts for these strategies. Keeping both driven by this one function
 * stops the two lists from drifting apart.
 */
export function isDomainI18nStrategy(strategy: string | undefined): boolean {
	return (
		strategy === 'domains-prefix-always' ||
		strategy === 'domains-prefix-other-locales' ||
		strategy === 'domains-prefix-always-no-redirect'
	);
}

/**
 * Per-config cache of parsed `domainLookupTable` entries. The table comes from
 * the (immutable) manifest, so its domain keys are parsed once and reused on
 * every request instead of being re-parsed per request. Keyed by the table
 * object itself so distinct apps don't share entries.
 */
const domainEntriesCache = new WeakMap<
	object,
	Array<{ host: string; protocol: string; locale: string }>
>();

function getDomainEntries(
	domainLookupTable: Record<string, string>,
): Array<{ host: string; protocol: string; locale: string }> {
	let entries = domainEntriesCache.get(domainLookupTable);
	if (!entries) {
		entries = Object.entries(domainLookupTable).map(([domainKey, locale]) => {
			// Safe because the protocol is forced via zod in the config; a throw
			// here would mean a tampered manifest (caught by the caller).
			const url = new URL(domainKey);
			return { host: url.host, protocol: url.protocol, locale };
		});
		domainEntriesCache.set(domainLookupTable, entries);
	}
	return entries;
}

/**
 * For domain-based i18n routing strategies, derives the locale-prefixed
 * pathname from the request's `Host` header rather than its URL. For example,
 * a request for `/foo` served from `https://example.fr` resolves to `/fr/foo`.
 *
 * Returns `undefined` when the strategy isn't domain-based or the host isn't
 * mapped to a locale — in which case normal pathname routing applies.
 *
 */
export function computePathnameFromDomain(
	request: Request,
	url: URL,
	i18n: SSRManifest['i18n'],
	base: SSRManifest['base'],
	trailingSlash: SSRManifest['trailingSlash'],
	logger: AstroLogger,
): string | undefined {
	let pathname: string | undefined = undefined;

	if (i18n && isDomainI18nStrategy(i18n.strategy)) {
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host
		let host = request.headers.get('X-Forwarded-Host');
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
		let protocol = request.headers.get('X-Forwarded-Proto');
		if (protocol) {
			// this header doesn't have a colon at the end, so we add to be in line with URL#protocol, which does have it
			protocol = protocol + ':';
		} else {
			// we fall back to the protocol of the request
			protocol = url.protocol;
		}
		if (!host) {
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Host
			host = request.headers.get('Host');
		}
		// If we don't have a host and a protocol, it's impossible to proceed
		if (host && protocol) {
			// The header might have a port in their name, so we remove it
			host = host.split(':')[0];
			try {
				let locale;
				const hostAsUrl = new URL(`${protocol}//${host}`);
				for (const entry of getDomainEntries(i18n.domainLookupTable)) {
					if (hostAsUrl.host === entry.host && hostAsUrl.protocol === entry.protocol) {
						locale = entry.locale;
						break;
					}
				}

				if (locale) {
					pathname = prependForwardSlash(
						joinPaths(normalizeTheLocale(locale), removeBase(url.pathname, base)),
					);
					if (trailingSlash === 'always') {
						pathname = appendForwardSlash(pathname);
					} else if (trailingSlash === 'never') {
						pathname = removeTrailingForwardSlash(pathname);
					} else if (url.pathname.endsWith('/')) {
						// trailingSlash === 'ignore': preserve the original trailing slash
						pathname = appendForwardSlash(pathname);
					}
				}
			} catch (e: any) {
				logger.error(
					'router',
					`Astro tried to parse ${protocol}//${host} as an URL, but it threw a parsing error. Check the X-Forwarded-Host and X-Forwarded-Proto headers.`,
				);
				logger.error('router', `Error: ${e}`);
			}
		}
	}
	return pathname;
}

/**
 * Mirror of `BaseApp.removeBase`, including the
 * `collapseDuplicateLeadingSlashes` fix that prevents middleware
 * authorization bypass when the URL starts with `//`.
 */
function removeBase(pathname: string, base: string): string {
	pathname = collapseDuplicateLeadingSlashes(pathname);
	if (pathname.startsWith(base)) {
		return pathname.slice(removeTrailingForwardSlash(base).length + 1);
	}
	return pathname;
}
