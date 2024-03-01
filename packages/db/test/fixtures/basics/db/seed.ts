import { db, Themes, Author } from 'astro:db';

await db
	.insert(Themes)
	.values([{ name: 'dracula' }, { name: 'monokai', added: new Date() }])
	.returning({ name: Themes.name });
await db
	.insert(Author)
	.values([
		{ name: 'Ben' },
		{ name: 'Nate' },
		{ name: 'Erika' },
		{ name: 'Bjorn' },
		{ name: 'Sarah' },
	]);
