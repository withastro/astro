import {
	appendForwardSlash,
	joinPaths,
	prependForwardSlash,
	removeTrailingForwardSlash,
	stripRequestBase,
} from '@astrojs/internal-helpers/path';
import { normalizeTheLocale } from '../../i18n/path.js';
import type { SSRManifest } from '../app/types.js';
import {
	getFirstForwardedValue,
	validateForwardedHeaders,
	validateHost,
} from '../app/validate-headers.js';
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
	allowedDomains: SSRManifest['allowedDomains'],
	logger: AstroLogger,
	pathnameFromRequest?: string,
): string | undefined {
	let pathname: string | undefined = undefined;

	if (
		i18n &&
		(i18n.strategy === 'domains-prefix-always' ||
			i18n.strategy === 'domains-prefix-other-locales' ||
			i18n.strategy === 'domains-prefix-always-no-redirect')
	) {
		const validated = validateForwardedHeaders(
			getFirstForwardedValue(request.headers.get('X-Forwarded-Proto') ?? undefined),
			getFirstForwardedValue(request.headers.get('X-Forwarded-Host') ?? undefined),
			getFirstForwardedValue(request.headers.get('X-Forwarded-Port') ?? undefined),
			allowedDomains,
		);
		const protocol = validated.protocol ? `${validated.protocol}:` : url.protocol;
		const requestHost = request.headers.get('Host') ?? undefined;
		const validatedRequestHost = allowedDomains?.length
			? validateHost(requestHost, protocol.slice(0, -1), allowedDomains)
			: requestHost;
		// Forwarded and original hosts are validated against security.allowedDomains when configured.
		let host = validated.host ?? validatedRequestHost;
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
					const requestPathname = pathnameFromRequest ?? stripRequestBase(url.pathname, base);
					pathname = prependForwardSlash(joinPaths(normalizeTheLocale(locale), requestPathname));
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
