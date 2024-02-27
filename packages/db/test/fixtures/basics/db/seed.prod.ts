import { db, Author } from 'astro:db';

await db
	.insert(Author)
	.values([
		{ name: 'Ben' },
		{ name: 'Nate' },
		{ name: 'Erika' },
		{ name: 'Bjorn' },
		{ name: 'Sarah' },
	]);
