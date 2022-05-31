import { rawContent, compiledContent } from '../imported-md/with-components.md';

export async function get() {
	return {
		body: JSON.stringify({
			raw: rawContent(),
			compiled: await compiledContent(),
		}),
	}
}
