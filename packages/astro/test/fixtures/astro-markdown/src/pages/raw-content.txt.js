import md from './basic.md?raw';

export async function GET() {
	return new Response(md);
}
