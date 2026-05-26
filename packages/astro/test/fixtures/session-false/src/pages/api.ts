import type { APIRoute } from 'astro';

// Surface the thrown error so the test can assert on the exact failure mode
// (SessionDisabledError) rather than just an unspecified 500.
export const GET: APIRoute = async (context) => {
	try {
		const value = await context.session!.get('value');
		return Response.json({ threw: false, value });
	} catch (err) {
		const error = err as { name?: string; message?: string };
		return Response.json(
			{ threw: true, name: error.name, message: error.message },
			{ status: 500 },
		);
	}
};
