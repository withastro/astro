import { Author, db } from 'astro:db';

const authors: Array<typeof Author.$inferInsert> = [
	{
		name: 'Ben',
	},
	{
		name: 'Nate',
	},
	{
		name: 'Erika',
	},
	{
		name: 'Bjorn',
	},
	{
		name: 'Sarah',
	},
];

await db.insert(Author).values(authors);
