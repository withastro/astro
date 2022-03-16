import { svelte2tsx } from 'svelte2tsx';

export const languageId = 'svelte';
export const extension = '.svelte';

export function toTSX(code: string): string {
	const result = `${svelte2tsx(code).code}

	let Props = render().props;

	export default function(props: typeof Props) {
		<></>
	}
`;

	return result;
}
