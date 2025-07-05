import { readFile, writeFile } from 'node:fs/promises';
import type { AstroConfig, AstroIntegrationLogger, IntegrationResolvedRoute } from 'astro';
import { createHostedRouteDefinition } from '@astrojs/underscore-redirects';

export async function createHeadersFile(
	config: AstroConfig,
	logger: AstroIntegrationLogger,
	routeToHeaders: Map<IntegrationResolvedRoute, Headers>,
) {
	const outUrl = new URL('_headers', config.outDir);
	const publicUrl = new URL('_headers', config.publicDir);

	// Parse existing _headers
	const headersByPattern = await loadExistingHeaders(publicUrl);

	// Merge in CSP headers if enabled
	if (config.experimental?.csp) {
		for (const [route, heads] of routeToHeaders) {
			if (!route.isPrerendered) continue;
			if (route.redirect) continue;
			const csp = heads.get('Content-Security-Policy');
			if (csp) {
				const def = createHostedRouteDefinition(route, config);
				const bucket = headersByPattern.get(def.input) ?? {};
				bucket['Content-Security-Policy'] = csp;
				headersByPattern.set(def.input, bucket);
			}
		}
	}

	if (headersByPattern.size === 0) {
		logger.info('No headers to write, skipping _headers generation.');
		return;
	}

	const output =
		[...headersByPattern]
			.map(([pattern, headers]) =>
				[pattern, ...Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`)].join('\n'),
			)
			.join('\n\n') + '\n';

	try {
		await writeFile(outUrl, output, 'utf-8');
	} catch (err) {
		logger.error(`Error writing _headers file: ${err}`);
	}
}

async function loadExistingHeaders(publicUrl: URL): Promise<Map<string, Record<string, string>>> {
	try {
		const text = await readFile(publicUrl, 'utf-8');
		return text
			.split(/\r?\n/)
			.filter(Boolean)
			.reduce(
				(map, line) => {
					if (!line.startsWith(' ')) {
						map.current = line.trim();
						map.store.set(map.current, map.store.get(map.current) ?? {});
					} else {
						const [key, ...rest] = line.trim().split(':');
						map.store.get(map.current)![key.trim()] = rest.join(':').trim();
					}
					return map;
				},
				{ current: '', store: new Map<string, Record<string, string>>() },
			).store;
	} catch {
		return new Map();
	}
}
