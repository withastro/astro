import { defineConfig } from 'astro/config';
import astroDb, { defineCollection, field } from '@astrojs/db';

const Recipe = defineCollection({
	fields: {
		id: field.number({ primaryKey: true, optional: true }),
		title: field.text(),
		description: field.text(),
	},
});

const Ingredient = defineCollection({
	fields: {
		id: field.number({ primaryKey: true, optional: true }),
		name: field.text(),
		quantity: field.number(),
		recipeId: field.text(),
	},
	indexes: {
		recipeIdx: { on: 'recipeId' },
	},
});

export default defineConfig({
	integrations: [astroDb()],
	db: {
		collections: { Recipe, Ingredient },
		async data({ seed }) {
			const pancakes = await seed(Recipe, {
				title: 'Pancakes',
				description: 'A delicious breakfast',
			});

			seed(Ingredient, [
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

			const pizza = await seed(Recipe, {
				title: 'Pizza',
				description: 'A delicious dinner',
			});

			seed(Ingredient, [
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
