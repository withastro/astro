import * as devalue from 'devalue';
import { stripRenderFn } from '../utils.js';
import { getEntryBySlug } from 'astro:content';

export async function GET() {
	const columbiaWithoutConfig = stripRenderFn(await getEntryBySlug('without-config', 'columbia'));
	const oneWithSchemaConfig = stripRenderFn(await getEntryBySlug('with-schema-config', 'one'));
	const twoWithSlugConfig = stripRenderFn(
		await getEntryBySlug('with-custom-slugs', 'interesting-two')
	);
	const postWithUnionSchema = stripRenderFn(await getEntryBySlug('with-union-schema', 'post'));

	return new Response(
		devalue.stringify({
			columbiaWithoutConfig,
			oneWithSchemaConfig,
			twoWithSlugConfig,
			postWithUnionSchema,
		})
	);
}
