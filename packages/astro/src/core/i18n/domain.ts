import {
	appendForwardSlash,
	collapseDuplicateLeadingSlashes,
	joinPaths,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { normalizeTheLocale } from '../../i18n/index.js';
import type { SSRManifest } from '../app/types.js';
import type { AstroLogger } from '../logger/core.js';

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

	if (
		i18n &&
		(i18n.strategy === 'domains-prefix-always' ||
			i18n.strategy === 'domains-prefix-other-locales' ||
			i18n.strategy === 'domains-prefix-always-no-redirect')
	) {
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
				for (const [domainKey, localeValue] of Object.entries(i18n.domainLookupTable)) {
					// This operation should be safe because we force the protocol via zod inside the configuration
					// If not, then it means that the manifest was tampered
					const domainKeyAsUrl = new URL(domainKey);

					if (
						hostAsUrl.host === domainKeyAsUrl.host &&
						hostAsUrl.protocol === domainKeyAsUrl.protocol
					) {
						locale = localeValue;
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
