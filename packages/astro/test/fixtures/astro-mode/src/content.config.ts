import { defineCollection } from "astro:content";

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
	})
});

export const collections = {
	rodents
};
