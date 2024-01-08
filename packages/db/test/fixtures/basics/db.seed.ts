import { Author, db } from 'astro:db';

const authors: Array<typeof Author.$inferInsert> = [
	{
		name: 'Ben',
	},
	{
		title: 'Nate',
	},
	{
		title: 'Erika',
	},
	{
		title: 'Bjorn',
	},
	{
		title: 'Sarah',
	},
];

await db.insert(Author).values(authors);
