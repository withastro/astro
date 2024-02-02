/// <reference path="./src/env.d.ts" />

import { defineData, Ingredient, Recipe } from 'astro:db';

export default defineData(async ({ seed }) => {
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
});
