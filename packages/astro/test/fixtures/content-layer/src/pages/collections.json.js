import { getCollection, getEntry } from 'astro:content';
import * as devalue from 'devalue';

export async function GET() {
	const customLoader = await getCollection('blog', (entry) => {
		return entry.data.id < 6;
	});
	const jsonLoader = await getCollection('dogs');

	const dataEntry = await getEntry('dogs', 'beagle');

	const simpleLoader = await getCollection('cats');

	const entryWithReference = await getEntry('spacecraft', 'columbia-copy');
	const atlantis = await getEntry('spacecraft', 'atlantis');
	const referencedEntry = await getEntry(entryWithReference.data.cat);

	const spacecraft = await getCollection('spacecraft');
	const spacecraftNoBody = await getCollection('spacecraftNoBody');

	const entryWithImagePath = await getEntry('spacecraft', 'lunar-module');

	const increment = await getEntry('increment', 'value');

	const images = await getCollection('images');

	const simpleLoaderObject = await getCollection('rodents')

	const probes = await getCollection('probes');

	const yamlLoader = await getCollection('fish');

	const tomlLoader = await getCollection('songs');

	const nestedJsonLoader = await getCollection('birds');

	const loaderWithAsyncParse = await getCollection('birdsWithAsyncParse');

	const csvLoader = await getCollection('plants');

	const rockets = await getCollection('rockets');

	const numbers = await getCollection('numbers');

	const numbersYaml = await getCollection('numbersYaml');

	const numbersToml = await getCollection('numbersToml');

	const renderMarkdownTest = await getEntry('renderMarkdownTest', 'with-frontmatter');
	const renderMarkdownWithImage = await getEntry('renderMarkdownTest', 'with-image');

	// Test for #12689 - dynamic import in loader
	const dynamicImportLoader = await getCollection('dynamicImport');
	
	return new Response(
		devalue.stringify({
			customLoader,
			jsonLoader,
			dataEntry,
			simpleLoader,
			simpleLoaderObject,
			entryWithReference,
			entryWithImagePath,
			referencedEntry,
			increment,
			numbers,
			numbersYaml,
			numbersToml,
			images,
			rockets,
			probes,
			yamlLoader,
			tomlLoader,
			nestedJsonLoader,
			loaderWithAsyncParse,
			csvLoader,
			atlantis,
			spacecraft: spacecraft.map(({id}) => id).sort((a, b) => a.localeCompare(b)),
			spacecraftWithBody: spacecraft.map(({id, body}) => ({id, body})),
			spacecraftNoBody: spacecraftNoBody.map(({id, body}) => ({id, body})),
			renderMarkdownTest,
			renderMarkdownWithImage,
			dynamicImportLoader,
		})
	);
}
