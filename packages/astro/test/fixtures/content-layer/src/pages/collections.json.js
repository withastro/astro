import { getCollection, getEntry } from 'astro:content';
import * as devalue from 'devalue';
import { stripAllRenderFn, stripRenderFn } from '../utils';

export async function GET() {
	const customLoader = stripAllRenderFn((await getCollection('blog')).slice(0, 10));
	const fileLoader = stripAllRenderFn(await getCollection('dogs'));

	const dataEntry = stripRenderFn(await getEntry('dogs', 'beagle'));

	const simpleLoader = stripAllRenderFn(await getCollection('cats'));

	const entryWithReference = stripRenderFn(await getEntry('spacecraft', 'columbia-copy'));
	const referencedEntry = stripRenderFn(await getEntry(entryWithReference.data.cat));

	const increment = stripRenderFn(await getEntry('increment', 'value'));

	return new Response(
		devalue.stringify({
			customLoader,
			fileLoader,
			dataEntry,
			simpleLoader,
			entryWithReference,
			referencedEntry,
			increment,
		})
	);
}
