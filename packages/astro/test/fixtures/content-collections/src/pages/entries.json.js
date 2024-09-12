import { getEntry } from 'astro:content';
import * as devalue from 'devalue';
import { stripRenderFn } from '../utils.js';

export async function GET() {
	const columbiaWithoutConfig = stripRenderFn(await getEntry('without-config', 'columbia'));
	const oneWithSchemaConfig = stripRenderFn(await getEntry('with-schema-config', 'one'));
	const twoWithSlugConfig = stripRenderFn(
		await getEntry('with-custom-slugs', 'interesting-two')
	);
	const postWithUnionSchema = stripRenderFn(await getEntry('with-union-schema', 'post'));

	return new Response(
		devalue.stringify({
			columbiaWithoutConfig,
			oneWithSchemaConfig,
			twoWithSlugConfig,
			postWithUnionSchema,
		})
	);
}
