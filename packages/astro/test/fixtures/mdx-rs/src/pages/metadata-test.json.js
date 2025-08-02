// Test endpoint to verify metadata extraction from MDX-rs
import { getCollection } from 'astro:content';

export async function GET() {
	// This would normally get markdown content, but for testing
	// we'll create a simple response to verify the build works
	const testData = {
		message: "MDX-rs metadata test endpoint",
		timestamp: new Date().toISOString(),
	};

	return new Response(JSON.stringify(testData, null, 2), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}