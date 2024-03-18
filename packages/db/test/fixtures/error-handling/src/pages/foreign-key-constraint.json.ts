import type { APIRoute } from 'astro';
import { db, Ingredient, LibsqlError } from 'astro:db';

export const GET: APIRoute = async () => {
	try {
		await db.insert(Ingredient).values({
			name: 'Flour',
			quantity: 1,
			// Trigger foreign key constraint error
			recipeId: 42,
		});
	} catch (e) {
		if (e instanceof LibsqlError) {
			return new Response(JSON.stringify({ error: `LibsqlError: ${e.message}` }));
		}
	}
	return new Response(JSON.stringify({ error: 'Did not raise expected exception' }));
};
