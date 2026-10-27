import { readFile } from 'node:fs/promises';
import { transform } from '@astrojs/compiler-rs';
import type { Plugin } from 'vite';

/**
 * Replaces Vite's regex-based `.astro` dependency scan with the scripts the Astro compiler hoists,
 * which are the same scripts `vite-plugin-astro` serves as `?astro&type=script` modules. Markup-like
 * text in frontmatter or template expressions is never mistaken for a script, and scripts Astro
 * renders inline (`is:inline`, or any attribute other than `src`) are not scanned.
 *
 * @see https://github.com/withastro/astro/issues/18068
 */
export function rolldownAstroClientScanPlugin(): Plugin {
	const scripts = new Map<string, { code: string; importer: string }>();

	return {
		name: 'astro:client-dep-scan',
		resolveId(source, importer) {
			if (scripts.has(source)) return source;

			const parentScript = importer && scripts.get(importer);
			if (parentScript) {
				return this.resolve(source, parentScript.importer, { skipSelf: true });
			}
		},
		async load(id) {
			const script = scripts.get(id);
			if (script) {
				// The scan's TypeScript transform drops unused imports, but Astro's tsconfig enables
				// `verbatimModuleSyntax`, so they are still requested at runtime.
				const imports = this.parse(script.code, { lang: 'ts' }).body.flatMap((node) =>
					node.type === 'ImportDeclaration' && node.importKind !== 'type'
						? [`\nimport ${JSON.stringify(node.source.value)};`]
						: [],
				);
				return { code: script.code + imports.join(''), moduleType: 'ts' };
			}
			if (!id.endsWith('.astro')) return;

			const { scripts: hoisted } = transform(await readFile(id, 'utf-8'), { filename: id });
			const code = hoisted.map((hoistedScript, index) => {
				if (hoistedScript.type === 'external')
					return `import ${JSON.stringify(hoistedScript.src!)};`;
				// The `.ts` extension lets Vite's scan transform for `import.meta.glob` run on the script.
				const scriptId = `${id}?astro-client-dep-scan=${index}&lang.ts`;
				scripts.set(scriptId, { code: hoistedScript.code!, importer: id });
				return `import ${JSON.stringify(scriptId)};`;
			});
			return { code: [...code, 'export default {};'].join('\n'), moduleType: 'js' };
		},
	};
}
