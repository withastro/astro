import { Ingredient, db, getDbError } from 'astro:db';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
	try {
		await db.insert(Ingredient).values({
			name: 'Flour',
			quantity: 1,
			// Trigger foreign key constraint error
			recipeId: 42,
		});
	} catch (e) {
		const dbError = getDbError(e);
		if (dbError) {
			return new Response(
				JSON.stringify({ message: `LibsqlError: ${dbError.message}`, code: dbError.code }),
			);
		}
	}
	return new Response(JSON.stringify({ message: 'Did not raise expected exception' }));
};
