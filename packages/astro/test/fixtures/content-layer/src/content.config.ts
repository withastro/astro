import { defineCollection, z, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { loader } from './loaders/post-loader.js';
import { readFile } from 'fs/promises';

const blog = defineCollection({
	loader: loader({ url: 'https://jsonplaceholder.typicode.com/posts' }),
});

const dogs = defineCollection({
	loader: file('src/data/dogs.json'),
	schema: z.object({
		breed: z.string(),
		id: z.string(),
		size: z.string(),
		origin: z.string(),
		lifespan: z.string(),
		temperament: z.array(z.string()),
	}),
});

const rodents = defineCollection({
	loader: () => ({
		capybara: {
			name: 'Capybara',
			scientificName: 'Hydrochoerus hydrochaeris',
			lifespan: 10,
			weight: 50000,
			diet: ['grass', 'aquatic plants', 'bark', 'fruits'],
			nocturnal: false,
		},
		hamster: {
			name: 'Golden Hamster',
			scientificName: 'Mesocricetus auratus',
			lifespan: 2,
			weight: 120,
			diet: ['seeds', 'nuts', 'insects'],
			nocturnal: true,
		},
		rat: {
			name: 'Brown Rat',
			scientificName: 'Rattus norvegicus',
			lifespan: 2,
			weight: 350,
			diet: ['grains', 'fruits', 'vegetables', 'meat'],
			nocturnal: true,
		},
		mouse: {
			name: 'House Mouse',
			scientificName: 'Mus musculus',
			lifespan: 1,
			weight: 20,
			diet: ['seeds', 'grains', 'fruits'],
			nocturnal: true,
		},
		guineaPig: {
			name: 'Guinea Pig',
			scientificName: 'Cavia porcellus',
			lifespan: 5,
			weight: 1000,
			diet: ['hay', 'vegetables', 'fruits'],
			nocturnal: false,
		},
	}),
	schema: z.object({
		name: z.string(),
		scientificName: z.string(),
		lifespan: z.number().int().positive(),
		weight: z.number().positive(),
		diet: z.array(z.string()),
		nocturnal: z.boolean(),
	}),
});
// Absolute paths should also work
const absoluteRoot = new URL('content/space', import.meta.url);

const spacecraft = defineCollection({
	loader: glob({ pattern: '*.md', base: absoluteRoot }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			publishedDate: z.coerce.date(),
			tags: z.array(z.string()),
			heroImage: image().optional(),
			cat: reference('cats').default('siamese'),
			something: z
				.string()
				.optional()
				.transform((str) => ({ type: 'test', content: str })),
		}),
});


const cats = defineCollection({
	loader: async function () {
		const file = new URL('data/cats.json', import.meta.url);
		const data = await readFile(file, 'utf-8');
		return JSON.parse(data);
	},
	schema: z.object({
		breed: z.string(),
		id: z.string(),
		size: z.string(),
		origin: z.string(),
		lifespan: z.string(),
		temperament: z.array(z.string()),
	}),
});

const fish = defineCollection({
	loader: file('src/data/fish.yaml'),
	schema: z.object({
		name: z.string(),
		breed: z.string(),
		age: z.number(),
	}),
});

const birds = defineCollection({
	loader: file('src/data/birds.json', {
		parser: (text) => JSON.parse(text).birds,
	}),
	schema: z.object({
		id: z.string(),
		name: z.string(),
		breed: z.string(),
		age: z.number(),
	}),
});

const plants = defineCollection({
	loader: file('src/data/plants.csv', {
		parser: (text) => {
			const [headers, ...rows] = text.trim().split('\n');
			return rows.map(row => Object.fromEntries(
			    headers.split(',').map((h, i) => [h, row.split(',')[i]])
			));
		},
	}),
	schema: z.object({
		id: z.string(),
		common_name: z.string(),
		scientific_name: z.string(),
		color: z.string(),
	}),
});

const probes = defineCollection({
	loader: glob({ pattern: ['*.md', '!voyager-*'], base: 'src/data/space-probes' }),
	schema: z.object({
		name: z.string(),
		type: z.enum(['Space Probe', 'Mars Rover', 'Comet Lander']),
		launch_date: z.date(),
		status: z.enum(['Active', 'Inactive', 'Decommissioned']),
		destination: z.string(),
		operator: z.string(),
		notable_discoveries: z.array(z.string()),
	}),
});

const numbers = defineCollection({
	loader: glob({ pattern: 'src/data/glob-data/*', base: '.' }),
});

const numbersYaml = defineCollection({
	loader: glob({ pattern: 'src/data/glob-yaml/*', base: '.' }),
});

const numbersToml = defineCollection({
	loader: glob({ pattern: 'src/data/glob-toml/*', base: '.' }),
});

const notADirectory = defineCollection({
	loader: glob({ pattern: '*', base: 'src/nonexistent' }),
});

const nothingMatches = defineCollection({
	loader: glob({ pattern: 'nothingmatches/*', base: 'src/data' }),
});
const images = defineCollection({
	loader: () => [
		{
			id: '1',
			image: '@images/shuttle.jpg',
		},
		{
			id: '2',
			image: 'https://images.unsplash.com/photo-1457364887197-9150188c107b?w=800&fm=jpg&fit=crop',
		},
	],
	schema: ({ image }) =>
		z.object({
			id: z.string(),
			image: image(),
		}),
});

const markdownContent = `
# heading 1
hello
## heading 2
![image](./image.png)
![image 2](https://example.com/image.png)
`

const increment = defineCollection({
	loader: {
		name: 'increment-loader',
		load: async ({ store, refreshContextData, parseData, renderMarkdown }) => {
			const entry = store.get<{ lastValue: number }>('value');
			const lastValue = entry?.data.lastValue ?? 0;
			const raw = {
				id: 'value',
				data: {
					lastValue: lastValue + 1,
					lastUpdated: new Date(),
					refreshContextData,
					slug: 'slimy'
				},
			}
			const parsed = await parseData(raw)
			store.set({
				id: raw.id,
				data: parsed,
				rendered: await renderMarkdown(markdownContent)
			});
		},
		// Example of a loader that returns an async schema function
		schema: async () =>
			z.object({
				lastValue: z.number(),
				lastUpdated: z.date(),
				refreshContextData: z.record(z.unknown()).optional(),
				slug: z.string().optional(),
			}),
	},
});

const artists = defineCollection({
        loader: file('src/data/artists.toml'),
        schema: z.object({
                name: z.string(),
                genre: z.string().array(),
        }),
});

const songs = defineCollection({
        loader: file('src/data/songs.toml'),
        schema: z.object({
                name: z.string(),
                artists: z.array(reference('artists')),
        }),
});

const rockets = defineCollection({
	loader: file('src/data/rockets.json'),
	schema: ({ image }) =>
		z.object({
			id: z.string(),
			name: z.string(),
			manufacturer: z.string(),
			image: image(),
		}),
});

export const collections = {
	blog,
	dogs,
	cats,
	fish,
	birds,
	plants,
	numbers,
	numbersToml,
	numbersYaml,
	spacecraft,
	increment,
	images,
	artists,
	songs,
	probes,
	rodents,
	rockets,
	notADirectory,
	nothingMatches
};

