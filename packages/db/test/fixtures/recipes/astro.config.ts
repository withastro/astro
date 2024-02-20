import { defineConfig } from 'astro/config';
import astroDb, { defineCollection, column } from '@astrojs/db';

const Recipe = defineCollection({
	columns: {
		id: column.number({ primaryKey: true }),
		title: column.text(),
		description: column.text(),
	},
});

const Ingredient = defineCollection({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text(),
		quantity: column.number(),
		recipeId: column.number(),
	},
	indexes: {
		recipeIdx: { on: 'recipeId' },
	},
	foreignKeys: [{ columns: 'recipeId', references: () => [Recipe.columns.id] }],
});

export default defineConfig({
	integrations: [astroDb()],
	db: {
		collections: { Recipe, Ingredient },
		async data({ seed, seedReturning }) {
			const pancakes = await seedReturning(Recipe, {
				title: 'Pancakes',
				description: 'A delicious breakfast',
			});

			await seed(Ingredient, [
				{
					name: 'Flour',
					quantity: 1,
					recipeId: pancakes.id,
				},
				{
					name: 'Eggs',
					quantity: 2,
					recipeId: pancakes.id,
				},
				{
					name: 'Milk',
					quantity: 1,
					recipeId: pancakes.id,
				},
			]);

			const pizza = await seedReturning(Recipe, {
				title: 'Pizza',
				description: 'A delicious dinner',
			});

			await seed(Ingredient, [
				{
					name: 'Flour',
					quantity: 1,
					recipeId: pizza.id,
				},
				{
					name: 'Eggs',
					quantity: 2,
					recipeId: pizza.id,
				},
				{
					name: 'Milk',
					quantity: 1,
					recipeId: pizza.id,
				},
				{
					name: 'Tomato Sauce',
					quantity: 1,
					recipeId: pizza.id,
				},
			]);
		},
	},
});
