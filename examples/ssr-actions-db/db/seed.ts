import { db, Todo } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
	// TODO
	await db.insert(Todo).values([
		{ id: 1, created: new Date(), task: "Write this demo" },
		{ id: 2, created: new Date(2024, 9, 6, 12, 30), completed: new Date(), task: "Seed the Database" }
	])
}
