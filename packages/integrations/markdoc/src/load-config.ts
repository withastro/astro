import * as fs from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroConfig } from 'astro';
import { rolldown } from 'rolldown';
import type { AstroMarkdocConfig } from './config.js';
import { MarkdocError } from './utils.js';

export const SUPPORTED_MARKDOC_CONFIG_FILES = [
	'markdoc.config.js',
	'markdoc.config.mjs',
	'markdoc.config.mts',
	'markdoc.config.ts',
];

export type MarkdocConfigResult = {
	config: AstroMarkdocConfig;
	fileUrl: URL;
};

export async function loadMarkdocConfig(
	astroConfig: Pick<AstroConfig, 'root'>,
): Promise<MarkdocConfigResult | undefined> {
	let markdocConfigUrl: URL | undefined;
	for (const filename of SUPPORTED_MARKDOC_CONFIG_FILES) {
		const filePath = new URL(filename, astroConfig.root);
		if (!fs.existsSync(filePath)) continue;

		markdocConfigUrl = filePath;
		break;
	}
	if (!markdocConfigUrl) return;

	const { code } = await bundleConfigFile({
		markdocConfigUrl,
		astroConfig,
	});
	const config: AstroMarkdocConfig = await loadConfigFromBundledFile(astroConfig.root, code);

	return {
		config,
		fileUrl: markdocConfigUrl,
	};
}

/**
 * Bundle config file to support `.ts` files.
 * Simplified fork from Vite's `bundleConfigFile` function:
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
async function bundleConfigFile({
	markdocConfigUrl,
	astroConfig,
}: {
	markdocConfigUrl: URL;
	astroConfig: Pick<AstroConfig, 'root'>;
}): Promise<{ code: string }> {
	let markdocError: MarkdocError | undefined;

	const bundle = await rolldown({
		input: fileURLToPath(markdocConfigUrl),
		cwd: fileURLToPath(astroConfig.root),
		platform: 'node',
		// Treat every bare import as external, so the config's dependencies are
		// loaded at runtime. `.astro` ids stay resolvable so the `stub-astro-imports`
		// plugin can turn them into the friendly error below.
		external: (id) => !id.endsWith('.astro') && !id.startsWith('.') && !isAbsolute(id),
		transform: {
			target: 'node16',
		},
		plugins: [
			{
				name: 'stub-astro-imports',
				resolveId(source) {
					if (source.endsWith('.astro')) {
						// Avoid throwing within rolldown.
						// This swallows the `hint` and blows up the stacktrace.
						markdocError = new MarkdocError({
							message: '`.astro` files are no longer supported in the Markdoc config.',
							hint: 'Use the `component()` utility to specify a component path instead. See https://docs.astro.build/en/guides/integrations-guide/markdoc/',
						});
						return {
							// Stub with an unused default export.
							id: 'data:text/javascript,export default true',
							external: true,
						};
					}
				},
			},
		],
	});

	try {
		const output = await bundle.generate({ format: 'esm', sourcemap: 'inline' });
		if (markdocError) throw markdocError;
		const chunk = output.output.find((item) => item.type === 'chunk');
		return { code: chunk?.code ?? '' };
	} finally {
		await bundle.close();
	}
}

/**
 * Forked from Vite config loader, replacing CJS-based path concat
 * with ESM only
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L1074
 */
async function loadConfigFromBundledFile(root: URL, code: string): Promise<AstroMarkdocConfig> {
	// Write it to disk, load it with native Node ESM, then delete the file.
	const tmpFileUrl = new URL(`markdoc.config.timestamp-${Date.now()}.mjs`, root);
	fs.writeFileSync(tmpFileUrl, code);
	try {
		return (await import(tmpFileUrl.pathname)).default;
	} finally {
		try {
			fs.unlinkSync(tmpFileUrl);
		} catch {
			// already removed if this function is called twice simultaneously
		}
	}
}
