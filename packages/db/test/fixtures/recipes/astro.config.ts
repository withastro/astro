import { defineConfig } from 'astro/config';
import db, { defineCollection, field } from '@astrojs/db';

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
});

export default defineConfig({
	integrations: [db()],
	db: {
		collections: { Recipe, Ingredient },
		async data({ set }) {
			const pancakes = await set(Recipe, {
				title: 'Pancakes',
				description: 'A delicious breakfast',
			});

			set(Ingredient, [
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

			const pizza = await set(Recipe, {
				title: 'Pizza',
				description: 'A delicious dinner',
			});

			set(Ingredient, [
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
