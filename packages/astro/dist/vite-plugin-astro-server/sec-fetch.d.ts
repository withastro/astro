import type { RemotePattern } from '@astrojs/internal-helpers/remote';
import type * as vite from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
/**
 * Middleware that validates Sec-Fetch metadata headers on incoming requests
 * to block cross-origin subresource requests (e.g. `<script>` tags from
 * another origin loading dev server modules).
 *
 * Navigation requests (`Sec-Fetch-Mode: navigate`) are always allowed through
 * because browsers enforce their own security model for top-level navigations.
 *
 * Requests without `Sec-Fetch-Site` (e.g. from non-browser clients like curl,
 * or older browsers that don't send Fetch Metadata) are also allowed through
 * to avoid breaking legitimate development workflows.
 *
 * When `security.allowedDomains` is configured, requests whose `Origin` header
 * matches one of the allowed patterns are also permitted. This supports proxied
 * dev server setups (e.g. ngrok, Cloudflare Tunnel) where the browser sees a
 * different origin than the dev server itself.
 */
export declare function secFetchMiddleware(
	logger: AstroLogger,
	allowedDomains?: Partial<RemotePattern>[],
): vite.Connect.NextHandleFunction;
