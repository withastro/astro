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
			const generics = extractGenerics(tsx);
			if (generics) {
				// Generic component: preserve type params using __sveltets_Render
				result = tsx.replace(
					'export default $$Component;',
					`export default function ${className}__AstroComponent_<${generics.params}>(_props: import('@astrojs/svelte/svelte-shims.d.ts').PropsWithClientDirectives<ReturnType<__sveltets_Render<${generics.names}>['props']>>): any {}`,
				);
			} else {
				result = tsx.replace(
					'export default $$Component;',
					`export default function ${className}__AstroComponent_(_props: import('@astrojs/svelte/svelte-shims.d.ts').PropsWithClientDirectives<import('svelte').ComponentProps<typeof $$$$Component>>): any {}`,
				);
			}
		} else {
			// Old svelte2tsx output
			result = tsx.replace(
				'export default class extends __sveltets_2_createSvelte2TsxComponent(',
				`export default function ${className}__AstroComponent_(_props: import('@astrojs/svelte/svelte-shims.d.ts').PropsWithClientDirectives<typeof Component.props>): any {}\nlet Component = `,
			);
		}
	} catch {
		return result;
	}

	return result;
}

function extractGenerics(tsx: string): { params: string; names: string } | null {
	const marker = 'class __sveltets_Render<';
	const startIdx = tsx.indexOf(marker);
	if (startIdx === -1) return null;

	const genericStart = startIdx + marker.length;
	let depth = 1;
	let i = genericStart;
	while (i < tsx.length && depth > 0) {
		if (tsx[i] === '<') depth++;
		if (tsx[i] === '>' && tsx[i - 1] !== '=') depth--;
		i++;
	}
	const params = tsx.substring(genericStart, i - 1);

	// Extract just the type parameter names by splitting at top-level commas
	const names: string[] = [];
	let current = '';
	let d = 0;
	for (const ch of params) {
		if (ch === '<') d++;
		if (ch === '>') d--;
		if (ch === ',' && d === 0) {
			const name = /^(\w+)/.exec(current.trim())?.[1];
			if (name) names.push(name);
			current = '';
		} else {
			current += ch;
		}
	}
	const lastName = /^(\w+)/.exec(current.trim())?.[1];
	if (lastName) names.push(lastName);

	return { params, names: names.join(', ') };
}
