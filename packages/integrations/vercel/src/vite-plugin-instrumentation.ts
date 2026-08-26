import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AstroError } from 'astro/errors';
import type { PluginOption } from 'vite';

const VIRTUAL_INSTRUMENTATION_ID = 'virtual:astro-vercel:instrumentation';
const RESOLVED_VIRTUAL_INSTRUMENTATION_ID = `\0${VIRTUAL_INSTRUMENTATION_ID}`;
const INSTRUMENTATION_FILES = [
	'instrumentation.ts',
	'instrumentation.js',
	'instrumentation.mts',
	'instrumentation.mjs',
];

export function findInstrumentationFile(
	directories: URL[],
	fileExists: (file: URL) => boolean = existsSync,
): URL | undefined {
	const uniqueDirectories = [
		...new Map(directories.map((directory) => [directory.href, directory])).values(),
	];
	const files = uniqueDirectories
		.flatMap((directory) => INSTRUMENTATION_FILES.map((file) => new URL(file, directory)))
		.filter(fileExists);

	if (files.length > 1) {
		throw new AstroError(
			`Multiple instrumentation files found:\n${files.map((file) => fileURLToPath(file)).join('\n')}`,
			'Keep only one instrumentation file in the Astro project root or source directory.',
		);
	}

	return files[0];
}

export function createInstrumentationModule(instrumentationFile?: URL): string {
	if (!instrumentationFile) {
		return `export function runWithInboundTraceContext(_headers, callback) {
	return callback();
}`;
	}

	return `import { register } from ${JSON.stringify(fileURLToPath(instrumentationFile))};
import { context, propagation } from '@opentelemetry/api';

await register();

export function runWithInboundTraceContext(headers, callback) {
	const extractedContext = propagation.extract(
		context.active(),
		Object.fromEntries(headers.entries()),
	);

	return context.with(extractedContext, callback);
}`;
}

export function createInstrumentationPlugin(instrumentationFile?: URL): PluginOption {
	return {
		name: VIRTUAL_INSTRUMENTATION_ID,
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_INSTRUMENTATION_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_INSTRUMENTATION_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_INSTRUMENTATION_ID}$`),
			},
			handler() {
				return createInstrumentationModule(instrumentationFile);
			},
		},
	};
}
