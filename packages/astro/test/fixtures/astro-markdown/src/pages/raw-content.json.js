import { content } from '../imported-md/with-components.md';

export async function get() {
	return {
		body: JSON.stringify({
			raw: content.raw(),
			compiled: await content.compiled(),
		}),
	}
}
