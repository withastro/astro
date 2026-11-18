export async function GET() {
	return new Response(String(process.exitCode ?? 'undefined'));
}
