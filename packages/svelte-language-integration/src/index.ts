import { svelte2tsx } from 'svelte2tsx';

export const languageId = 'svelte';
export const extension = '.svelte';

export function toTSX(code: string): string {
	let result = 'export default function(): any {}';

	try {
		result = `${svelte2tsx(code).code}

		let Props = render().props;

		export default function(props: typeof Props): any {
			<div></div>
		}
	`;

		// Remove default class export from Svelte2TSX since we don't use it and instead add our own
		result = result.replace('export default class', 'export class');
	} catch (e: any) {
		return result;
	}

	return result;
}
