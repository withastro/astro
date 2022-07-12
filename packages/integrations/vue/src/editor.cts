import { parse } from '@vue/compiler-sfc';

export function toTSX(code: string, className: string): string {
	let result = `export default function ${className}__AstroComponent_(_props: Record<string, any>): any {}`;

	// NOTE: As you can expect, using regexes for this is not exactly the most reliable way of doing things
	// However, I couldn't figure out a way to do it using Vue's compiler, I tried looking at how Volar does it, but I
	// didn't really understand everything happening there and it seemed to be pretty Volar-specific. I do believe
	// someone more knowledgable on Vue's internals could figure it out, but since this solution is good enough for most
	// Vue components (and it's an improvement over, well, nothing), it's alright, I think
	try {
		const parsedResult = parse(code);

		if (parsedResult.errors.length > 0) {
			return `
				let ${className}__AstroComponent_: Error
				export default ${className}__AstroComponent_
			`;
		}

		if (parsedResult.descriptor.scriptSetup) {
			const definePropsType =
				parsedResult.descriptor.scriptSetup.content.match(/defineProps<([\s\S]+)>/m);

			if (definePropsType) {
				result = `
						${parsedResult.descriptor.scriptSetup.content}

						export default function ${className}__AstroComponent_(_props: ${definePropsType[1]}): any {
							<div></div>
						}
				`;
			} else {
				const defineProps =
					parsedResult.descriptor.scriptSetup.content.match(/defineProps\([\s\S]+\)/m);

				if (defineProps) {
					result = `
					import { defineProps } from '@vue/runtime-core';

					const Props = ${defineProps[0]}

					export default function ${className}__AstroComponent_(_props: typeof Props): any {
						<div></div>
					}
				`;
				}
			}
		}
	} catch (e: any) {
		return result;
	}

	return result;
}
