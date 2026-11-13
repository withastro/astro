import { matchHostname, type RemotePattern } from '@astrojs/internal-helpers/remote';

/**
 * Parses a potentially comma-separated multi-value header (as produced by
 * proxy chains) and returns the first value, trimmed of whitespace.
 * Returns `undefined` when the header is absent or empty.
 */
export function getFirstForwardedValue(
	multiValueHeader: string | string[] | undefined,
): string | undefined {
	return multiValueHeader
		?.toString()
		.split(',')
		.map((e) => e.trim())[0];
}

/**
 * A host is a hostname (DNS name or IPv4 address) with an optional port. Anything else,
 * such as userinfo (`user@`), path, query or fragment characters, whitespace or
 * percent-encoding, is not a valid `Host`/`X-Forwarded-Host` value.
 */
const HOST_RE = /^[\w-]+(?:\.[\w-]+)*(?::\d{1,5})?$/;

/**
 * Returns the host only if it is a plain `hostname[:port]`, otherwise `undefined`.
 */
function sanitizeHost(host: string | undefined): string | undefined {
	if (!host) return undefined;
	if (!HOST_RE.test(host)) return undefined;
	return host;
}

type AllowedDomain = Partial<RemotePattern>;

interface ParsedHost {
	/** The host as given, e.g. `Example.com:8080`. */
	host: string;
	/** The normalized (lower-case) hostname, e.g. `example.com`. */
	hostname: string;
	/** The port as given, if any. */
	port: string | undefined;
}

/**
 * Parses a `Host`/`X-Forwarded-Host` value into its hostname and port. Returns
 * `undefined` for anything that isn't a plain `hostname[:port]`.
 */
function parseHost(host: string | undefined): ParsedHost | undefined {
	const sanitized = sanitizeHost(host);
	if (!sanitized) return undefined;

	const [hostname, port] = sanitized.split(':');
	const urlString = `http://${sanitized}`;
	if (!URL.canParse(urlString)) return undefined;

	// The URL must describe exactly the host that was given, so the host that is matched
	// is the same one callers later apply.
	const url = new URL(urlString);
	if (url.username !== '' || url.password !== '' || url.hostname !== hostname.toLowerCase()) {
		return undefined;
	}

	return { host: sanitized, hostname: url.hostname, port };
}

const DEFAULT_PORTS: Record<string, string> = { http: '80', https: '443' };

/**
 * An entry without a `protocol` allows `http` and `https`. An entry with a `protocol`
 * allows exactly that protocol.
 */
function allowsProtocol(entry: AllowedDomain, protocol: string): boolean {
	if (entry.protocol === undefined) return protocol === 'http' || protocol === 'https';
	return entry.protocol === protocol.toLowerCase();
}

/**
 * Whether a single entry allows this protocol, hostname and port together.
 *
 * - `port` is the port of the host (e.g. from `example.com:8080`). An entry without a `port`
 *   allows any port. An entry with a `port` is compared against the port, or against the
 *   protocol's default port when the host has none, so `port: '443'` matches `https://host`.
 * - `forwardedPort` is the `X-Forwarded-Port` value. It is only allowed by an entry that
 *   lists it explicitly.
 */
function matchesEntry(
	entry: AllowedDomain,
	protocol: string,
	host: ParsedHost,
	forwardedPort?: string,
): boolean {
	if (!allowsProtocol(entry, protocol)) return false;
	if (!matchHostname({ hostname: host.hostname } as URL, entry.hostname, true)) return false;
	if (forwardedPort !== undefined) return entry.port === forwardedPort;
	if (entry.port === undefined) return true;
	return entry.port === (host.port ?? DEFAULT_PORTS[protocol.toLowerCase()]);
}

function matchesAnyEntry(
	allowedDomains: AllowedDomain[],
	protocol: string,
	host: ParsedHost,
	forwardedPort?: string,
): boolean {
	return allowedDomains.some((entry) => matchesEntry(entry, protocol, host, forwardedPort));
}

/**
 * Validate a host against allowedDomains.
 * Returns the host only if it matches an allowed pattern; otherwise, undefined.
 * This prevents SSRF attacks by ensuring the Host header is trusted.
 */
export function validateHost(
	host: string | undefined,
	protocol: string,
	allowedDomains?: AllowedDomain[],
): string | undefined {
	if (!allowedDomains || allowedDomains.length === 0) return undefined;

	const parsed = parseHost(host);
	if (!parsed) return undefined;

	return matchesAnyEntry(allowedDomains, protocol, parsed) ? parsed.host : undefined;
}

/** A protocol value such as `https`, without the trailing colon. */
const PROTOCOL_RE = /^[a-z][a-z0-9+.-]*$/i;

/**
 * Validate forwarded headers (proto, host, port) against allowedDomains.
 *
 * Protocol, host and port are validated together against each entry, never one at a time:
 * - The forwarded host is accepted if an entry allows it with the forwarded protocol, or
 *   with `fallback.protocol` (the protocol the server would otherwise use).
 * - The forwarded protocol is accepted only if an entry for the host in use (the accepted
 *   forwarded host, or else `fallback.host`) allows it. If no entry matches that host, the
 *   forwarded protocol is not trusted.
 * - The forwarded port is accepted only if the entry for the host in use lists it.
 *
 * Returns the values to apply. Values that aren't returned must not be applied.
 *
 * @param fallback What the server would use without forwarded headers: the protocol of the
 *   connection or platform request, and the `Host` header or request URL host.
 */
export function validateForwardedHeaders(
	forwardedProtocol: string | undefined,
	forwardedHost: string | undefined,
	forwardedPort: string | undefined,
	allowedDomains: AllowedDomain[] | undefined,
	fallback: { protocol: string; host?: string },
): { protocol?: string; host?: string; port?: string } {
	// When no allowedDomains is configured, do not trust any forwarded header.
	// Without allowedDomains there is no proxy configuration to validate against,
	// so accepting a forwarded value could let an attacker change the origin
	// used for comparisons (e.g., switching http to https).
	if (!allowedDomains || allowedDomains.length === 0) return {};

	const protocol =
		forwardedProtocol && PROTOCOL_RE.test(forwardedProtocol) ? forwardedProtocol : undefined;
	const port = forwardedPort && /^\d{1,5}$/.test(forwardedPort) ? forwardedPort : undefined;

	// Prefer the forwarded protocol, then fall back to the protocol the server would use.
	const protocols = protocol ? [protocol, fallback.protocol] : [fallback.protocol];

	/**
	 * Finds the first protocol that an entry allows for this host, and whether the forwarded
	 * port is allowed with it. A forwarded port that isn't listed for the host is dropped
	 * rather than rejecting the host.
	 */
	const resolve = (host: ParsedHost, candidates: string[]) => {
		for (const candidate of candidates) {
			if (port !== undefined && matchesAnyEntry(allowedDomains, candidate, host, port)) {
				return { protocol: candidate, port };
			}
			if (matchesAnyEntry(allowedDomains, candidate, host)) {
				return { protocol: candidate, port: undefined };
			}
		}
		return undefined;
	};

	const result: { protocol?: string; host?: string; port?: string } = {};

	const parsedForwardedHost = parseHost(forwardedHost);
	const forwardedMatch = parsedForwardedHost && resolve(parsedForwardedHost, protocols);
	if (parsedForwardedHost && forwardedMatch) {
		result.host = parsedForwardedHost.host;
		if (protocol !== undefined && forwardedMatch.protocol === protocol) {
			result.protocol = protocol;
		}
		if (forwardedMatch.port !== undefined) {
			result.port = forwardedMatch.port;
		}
		return result;
	}

	// No forwarded host was accepted, so the forwarded protocol and port must be allowed for
	// the host the server uses instead. If that host isn't allowed at all, trust neither.
	const parsedFallbackHost = parseHost(fallback.host);
	const fallbackMatch = parsedFallbackHost && resolve(parsedFallbackHost, protocols);
	if (fallbackMatch) {
		if (protocol !== undefined && fallbackMatch.protocol === protocol) {
			result.protocol = protocol;
		}
		if (fallbackMatch.port !== undefined) {
			result.port = fallbackMatch.port;
		}
	}

	return result;
}
