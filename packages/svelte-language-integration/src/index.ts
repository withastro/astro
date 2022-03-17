import { svelte2tsx } from 'svelte2tsx';

export const languageId = 'svelte';
export const extension = '.svelte';

export function toTSX(code: string): string {
	let result = 'export default function() {}';

	try {
		result = `${svelte2tsx(code).code}

		let Props = render().props;

		export default function(props: typeof Props) {
			<></>
		}
	`;
	} catch(e: any) {
		return result
	}

	return result;
}
