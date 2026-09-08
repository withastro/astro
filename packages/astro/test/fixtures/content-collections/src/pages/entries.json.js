import { getEntry } from 'astro:content';
import * as devalue from 'devalue';

export async function GET() {
	const oneWithSchemaConfig = await getEntry('with-schema-config', 'one');
	const twoWithCustomSlugs = await getEntry('with-custom-slugs', 'interesting-two');
	const postWithUnionSchema = await getEntry('with-union-schema', 'post');

	return new Response(
		devalue.stringify({
			oneWithSchemaConfig,
			twoWithCustomSlugs,
			postWithUnionSchema,
		})
	);
}
