import { svelte2tsx } from 'svelte2tsx';

export function toTSX(code: string, className: string): string {
	let result = `
		let ${className}__AstroComponent_: Error
		export default ${className}__AstroComponent_
	`;

	try {
		let tsx = svelte2tsx(code).code;
		tsx = 'let Props = render().props;\n' + tsx;

		// Replace Svelte's class export with a function export
		result = tsx.replace(
			/^export default[\S\s]*/gm,
			`export default function ${className}__AstroComponent_(_props: typeof Props): any {}`
		);
	} catch (e: any) {
		return result;
	}

	return result;
}
