import { getCollection } from 'astro:content';
import * as devalue from 'devalue';

export async function GET() {
	const withSchemaConfig = await getCollection('with-schema-config');
	const withCustomSlugs = await getCollection('with-custom-slugs');
	const withUnionSchema = await getCollection('with-union-schema');
	const withSymlinkedContent = await getCollection('with-symlinked-content');
	const withSymlinkedData = await getCollection('with-symlinked-data');

	return new Response(
		devalue.stringify({ withSchemaConfig, withCustomSlugs, withUnionSchema, withSymlinkedContent, withSymlinkedData }),
	);
}
