import { db, Author, Themes } from 'astro:db';

await db.batch([
	db
		.insert(Themes)
		.values([{ name: 'dracula' }, { name: 'monokai', added: new Date() }])
		.returning({ name: Themes.name }),
	db
		.insert(Author)
		.values([
			{ name: 'Ben' },
			{ name: 'Nate' },
			{ name: 'Erika' },
			{ name: 'Bjorn' },
			{ name: 'Sarah' },
		]),
]);
