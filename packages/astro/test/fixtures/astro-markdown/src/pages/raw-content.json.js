import { rawContent, compiledContent } from './basic.md';

export async function GET() {
	return {
		body: JSON.stringify({
			raw: rawContent(),
			compiled: await compiledContent(),
		}),
	}
}
