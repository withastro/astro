import { rawContent } from '../imported-md/with-components.md';

export async function get() {
	return {
		body: JSON.stringify({
			markdown: rawContent(),
			html: await rawContent.parseHtml(),
		}),
	}
}
