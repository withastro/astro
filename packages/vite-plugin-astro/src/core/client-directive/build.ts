import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';

/**
 * Build a client directive entrypoint into code that can directly run in a `<script>` tag.
 */
export async function buildClientDirectiveEntrypoint(
	name: string,
	entrypoint: string | URL,
	root: URL,
) {
	const stringifiedName = JSON.stringify(name);
	const entrypointPath = entrypoint instanceof URL ? fileURLToPath(entrypoint) : entrypoint;
	const stringifiedEntrypoint = JSON.stringify(entrypointPath);
	const rootPath = fileURLToPath(root);
	const virtualEntryId = fileURLToPath(new URL('__astro_client_directive__.js', root));

	const bundle = await rolldown({
		input: virtualEntryId,
		cwd: rootPath,
		platform: 'browser',
		plugins: [
			{
				name: 'astro:client-directive',
				resolveId(source) {
					if (source === virtualEntryId) {
						return virtualEntryId;
					}
				},
				load(source) {
					if (source !== virtualEntryId) {
						return;
					}
					// NOTE: when updating this code, make sure to also update `scripts/cmd/prebuild.js`
					// that prebuilds the client directive with a similar code too.
					return `\
import directive from ${stringifiedEntrypoint};

(self.Astro || (self.Astro = {}))[${stringifiedName}] = directive;

window.dispatchEvent(new Event('astro:' + ${stringifiedName}));`;
				},
			},
		],
	});

	try {
		const output = await bundle.generate({ format: 'iife', minify: true });
		const chunk = output.output.find((item) => item.type === 'chunk');
		return chunk?.code ?? '';
	} finally {
		await bundle.close();
	}
}
