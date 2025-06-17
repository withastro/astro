import { readFile, writeFile } from 'node:fs/promises';
import {
	removeLeadingForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type { AstroConfig, AstroIntegrationLogger, IntegrationResolvedRoute } from 'astro';

function segmentsToCfSyntax(
	segments: IntegrationResolvedRoute['segments'],
	config: AstroConfig,
): string {
	const base = removeLeadingForwardSlash(removeTrailingForwardSlash(config.base));
	let path = base ? `/${base}` : '';
	for (const seg of segments.flat()) {
		path += seg.dynamic ? '/*' : `/${seg.content}`;
	}
	return path || '/';
}

export async function createHeadersFile(
	config: AstroConfig,
	logger: AstroIntegrationLogger,
	headers?: Map<IntegrationResolvedRoute, Headers>,
) {
	const outUrl = new URL('./_headers', config.outDir);
	const headersByPattern = new Map<string, Record<string, string>>();

	// Load existing _headers (if any)
	try {
		const raw = await readFile(outUrl, 'utf-8');
		let currentPattern = '';
		for (const line of raw.split(/\r?\n/)) {
			if (!line.trim()) continue;
			if (!/^\s/.test(line)) {
				currentPattern = line.trim();
				headersByPattern.set(currentPattern, headersByPattern.get(currentPattern) || {});
			} else {
				const [name, ...rest] = line.trim().split(':');
				headersByPattern.get(currentPattern)![name.trim()] = rest.join(':').trim();
			}
		}
	} catch (err: any) {
		if (err.code !== 'ENOENT') logger.error(`Error reading _headers: ${err}`);
	}

	// Add in CSP headers from Astro’s resolver (if enabled)
	if (config.experimental?.csp && headers?.size) {
		for (const [route, heads] of headers) {
			const csp = heads.get('Content-Security-Policy');
			if (!csp) continue;

			const pattern = segmentsToCfSyntax(route.segments, config);
			const rec = headersByPattern.get(pattern) || {};
			rec['Content-Security-Policy'] = csp;
			headersByPattern.set(pattern, rec);
		}
	}

	// Bail out if nothing to write
	if (headersByPattern.size === 0) {
		logger.info('No headers to write, skipping _headers file generation.');
		return;
	}

	// Serialize and write
	const output =
		[...headersByPattern.entries()]
			.map(([pattern, map]) =>
				[pattern, ...Object.entries(map).map(([k, v]) => `  ${k}: ${v}`)].join('\n'),
			)
			.join('\n\n') + '\n';

	try {
		await writeFile(outUrl, output, 'utf-8');
	} catch (err) {
		logger.error(`Error writing _headers file: ${err}`);
	}
}
