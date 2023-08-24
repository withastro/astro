import { getHeadings } from './with-layout.md';

export async function GET() {
	return {
		body: JSON.stringify({
			headings: getHeadings(),
		}),
	}
}
