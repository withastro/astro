import { rawContent, compiledContent } from './basic.md';

export async function get() {
	return {
		body: JSON.stringify({
			raw: rawContent(),
			compiled: await compiledContent(),
		}),
	}
}
