import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { MarkdocError } from './utils.js';
const SUPPORTED_MARKDOC_CONFIG_FILES = [
	'markdoc.config.js',
	'markdoc.config.mjs',
	'markdoc.config.mts',
	'markdoc.config.ts',
];
async function loadMarkdocConfig(astroConfig) {
	let markdocConfigUrl;
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
	const config = await loadConfigFromBundledFile(astroConfig.root, code);
	return {
		config,
		fileUrl: markdocConfigUrl,
	};
}
async function bundleConfigFile({ markdocConfigUrl, astroConfig }) {
	let markdocError;
	const result = await esbuild({
		absWorkingDir: fileURLToPath(astroConfig.root),
		entryPoints: [fileURLToPath(markdocConfigUrl)],
		outfile: 'out.js',
		write: false,
		target: ['node16'],
		platform: 'node',
		packages: 'external',
		bundle: true,
		format: 'esm',
		sourcemap: 'inline',
		metafile: true,
		plugins: [
			{
				name: 'stub-astro-imports',
				setup(build) {
					build.onResolve({ filter: /.*\.astro$/ }, () => {
						markdocError = new MarkdocError({
							message: '`.astro` files are no longer supported in the Markdoc config.',
							hint: 'Use the `component()` utility to specify a component path instead. See https://docs.astro.build/en/guides/integrations-guide/markdoc/',
						});
						return {
							// Stub with an unused default export.
							path: 'data:text/javascript,export default true',
							external: true,
						};
					});
				},
			},
		],
	});
	if (markdocError) throw markdocError;
	const { text } = result.outputFiles[0];
	return {
		code: text,
		dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [],
	};
}
async function loadConfigFromBundledFile(root, code) {
	const tmpFileUrl = new URL(`markdoc.config.timestamp-${Date.now()}.mjs`, root);
	fs.writeFileSync(tmpFileUrl, code);
	try {
		return (await import(tmpFileUrl.pathname)).default;
	} finally {
		try {
			fs.unlinkSync(tmpFileUrl);
		} catch {}
	}
}
export { SUPPORTED_MARKDOC_CONFIG_FILES, loadMarkdocConfig };
