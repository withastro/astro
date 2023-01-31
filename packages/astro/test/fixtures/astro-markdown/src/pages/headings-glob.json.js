import { getHeadings } from './with-layout.md';

export async function get() {
	return {
		body: JSON.stringify({
			headings: getHeadings(),
		}),
	}
}
