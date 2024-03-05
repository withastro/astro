import { db } from 'astro:db';
import { menu } from './shared';
import { asDrizzleTable } from '@astrojs/db/utils';

export default async function () {
	const table = asDrizzleTable('menu', menu);

	await db.insert(table).values([
		{ name: 'Pancakes', price: 9.5, type: 'Breakfast' },
		{ name: 'French Toast', price: 11.25, type: 'Breakfast' },
		{ name: 'Coffee', price: 3, type: 'Beverages' },
		{ name: 'Cappuccino', price: 4.5, type: 'Beverages' },
	]);
}
