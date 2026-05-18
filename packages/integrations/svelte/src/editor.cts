import { svelte2tsx } from 'svelte2tsx';

const genericNameRE = /^(?:const |in |out )*(\w+)/;

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
			const genericSuffix = generics ? `<${generics.params}>` : '';
			const innerType = generics
				? `ReturnType<__sveltets_Render<${generics.names}>['props']>`
				: `import('svelte').ComponentProps<typeof $$$$Component>`;
			// Generic components use a simpler type wrapper that preserves generic
			// inference. Non-generic components use the full snippet handling.
			const propsType = generics ? 'GenericPropsWithClientDirectives' : 'PropsWithClientDirectives';
			result = tsx.replace(
				'export default $$Component;',
				`export default function ${className}__AstroComponent_${genericSuffix}(_props: import('@astrojs/svelte/svelte-shims.d.ts').${propsType}<${innerType}>): any {}`,
			);
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

// Extracts generic type parameters from svelte2tsx output for generic Svelte components
//
// Given: `class __sveltets_Render<T extends Record<string, unknown>, U extends keyof T>`,
// Returns: `{ params: "T extends Record<string, unknown>, U extends keyof T", names: "T, U" }`
//
// `params` is the full declaration (used to define the generic function),
// `names` is just the identifiers (used to pass type args to __sveltets_Render).
//
// Returns null when the input has no __sveltets_Render class (non-generic component).
export function extractGenerics(tsx: string): { params: string; names: string } | null {
	const marker = 'class __sveltets_Render<';
	const startIdx = tsx.indexOf(marker);
	if (startIdx === -1) return null;

	// Find the matching `>` that closes the generic parameter list,
	// tracking `<>` depth and skipping `=>` (arrow return types)
	const genericStart = startIdx + marker.length;
	let depth = 1;
	let i = genericStart;
	while (i < tsx.length && depth > 0) {
		if (tsx[i] === '<') depth++;
		if (tsx[i] === '>' && tsx[i - 1] !== '=') depth--;
		i++;
	}
	const params = tsx.substring(genericStart, i - 1);

	// Split params by top-level commas to extract individual type parameter names.
	// Tracks bracket depth for `<>`, `()`, `{}`, `[]` to skip commas inside
	// nested types like `Record<string, unknown>`, `[string, number]`,
	// `{ a: string, b: number }`, or `(a: number, b: string) => void`
	const names: string[] = [];
	let current = '';
	let depth2 = 0;
	let prev = '';
	for (const ch of params) {
		if (ch === '<' || ch === '(' || ch === '{' || ch === '[') depth2++;
		if ((ch === '>' && prev !== '=') || ch === ')' || ch === '}' || ch === ']') depth2--;
		if (ch === ',' && depth2 === 0) {
			// Skip variance/const modifiers to get the actual type parameter name
			const name = genericNameRE.exec(current.trim())?.[1];
			if (name) names.push(name);
			current = '';
		} else {
			current += ch;
		}
		prev = ch;
	}
	const lastName = genericNameRE.exec(current.trim())?.[1];
	if (lastName) names.push(lastName);

	return { params, names: names.join(', ') };
}
