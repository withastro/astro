/// <reference path="./src/env.d.ts" />
import { db, defineData, Ingredient, Recipe } from 'astro:db';

export default defineData(async ({ seed }) => {
	await seed(Recipe, {
		title: 'Pancakes',
		description: 'A delicious breakfast',
	});
	await db.insert(Recipe).values({});
});
