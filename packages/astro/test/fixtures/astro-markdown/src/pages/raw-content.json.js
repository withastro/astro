import { rawContent, compiledContent } from './basic.md';

export async function GET() {
	return Response.json({
		raw: rawContent(),
		compiled: await compiledContent(),
	});
}
