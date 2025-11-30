import { svelte2tsx } from 'svelte2tsx';

export function toTSX(code: string, className: string): string {
	let result = `
		let ${className}__AstroComponent_: Error
		export default ${className}__AstroComponent_
	`;

	try {
		let tsx = svelte2tsx(code, { mode: 'ts', isTsFile: true }).code;
		tsx = "import '@astrojs/svelte/svelte-shims.d.ts';\n" + tsx;

		// New svelte2tsx output (Svelte 5)
		if (tsx.includes('export default $$Component;')) {
			result = tsx.replace(
				'export default $$Component;',
				`export default function ${className}__AstroComponent_(_props: import('svelte').ComponentProps<typeof $$$$Component>): any {}`,
			);
		} else {
			// Old svelte2tsx output
			result = tsx.replace(
				'export default class extends __sveltets_2_createSvelte2TsxComponent(',
				`export default function ${className}__AstroComponent_(_props: typeof Component.props): any {}\nlet Component = `,
			);
		}
	} catch {
		return result;
	}

	return result;
}
