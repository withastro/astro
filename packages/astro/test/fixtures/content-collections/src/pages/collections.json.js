import * as devalue from 'devalue';
import { stripAllRenderFn } from '../utils.js';
import { getCollection } from 'astro:content';

export async function GET() {
	const withoutConfig = stripAllRenderFn(await getCollection('without-config'));
	const withSchemaConfig = stripAllRenderFn(await getCollection('with-schema-config'));
	const withSlugConfig = stripAllRenderFn(await getCollection('with-custom-slugs'));
	const withUnionSchema = stripAllRenderFn(await getCollection('with-union-schema'));

	return new Response(
		devalue.stringify({ withoutConfig, withSchemaConfig, withSlugConfig, withUnionSchema })
	);
}
