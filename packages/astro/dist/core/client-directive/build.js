import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
async function buildClientDirectiveEntrypoint(name, entrypoint, root) {
	const stringifiedName = JSON.stringify(name);
	const stringifiedEntrypoint = JSON.stringify(entrypoint);
	const output = await build({
		stdin: {
			contents: `import directive from ${stringifiedEntrypoint};

(self.Astro || (self.Astro = {}))[${stringifiedName}] = directive;

window.dispatchEvent(new Event('astro:' + ${stringifiedName}));`,
			resolveDir: fileURLToPath(root),
		},
		absWorkingDir: fileURLToPath(root),
		format: 'iife',
		minify: true,
		bundle: true,
		write: false,
	});
	const outputFile = output.outputFiles?.[0];
	if (!outputFile) return '';
	return outputFile.text;
}
export { buildClientDirectiveEntrypoint };
