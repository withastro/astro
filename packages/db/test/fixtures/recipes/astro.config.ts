import { defineConfig } from 'astro/config';
import db, { defineCollection, field } from '@astrojs/db';

const Recipe = defineCollection({
	fields: {
		id: field.number({ primaryKey: true }),
		title: field.text(),
		description: field.text(),
	},
});

const Ingredient = defineCollection({
	fields: {
		id: field.number({ primaryKey: true }),
		name: field.text(),
		quantity: field.number(),
		recipeId: field.text(),
	},
});

export default defineConfig({
	integrations: [db()],
	db: {
		collections: { Recipe, Ingredient },
		async data({ db, Recipe, Ingredient }) {
			const pancakes = await db
				.insert(Recipe)
				.values({ title: 'Pancakes', description: 'A delicious breakfast' })
				.returning()
				.get();
			await db.insert(Ingredient).values({ name: 'Flour', quantity: 1, recipeId: pancakes.id });
			await db.insert(Ingredient).values({ name: 'Eggs', quantity: 2, recipeId: pancakes.id });
			await db.insert(Ingredient).values({ name: 'Milk', quantity: 1, recipeId: pancakes.id });

			const pizza = await db
				.insert(Recipe)
				.values({ title: 'Pizza', description: 'A delicious dinner' })
				.returning()
				.get();
			await db.insert(Ingredient).values({ name: 'Flour', quantity: 1, recipeId: pizza.id });
			await db.insert(Ingredient).values({ name: 'Eggs', quantity: 2, recipeId: pizza.id });
			await db.insert(Ingredient).values({ name: 'Milk', quantity: 1, recipeId: pizza.id });
			await db.insert(Ingredient).values({ name: 'Tomato Sauce', quantity: 1, recipeId: pizza.id });
		},
	},
});
