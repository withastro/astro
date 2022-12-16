import { getCollection } from 'astro:content';
import * as devalue from 'devalue';
import { stripAllRenderFn } from '../utils.js';

export async function get() {
	const withoutConfig = stripAllRenderFn(await getCollection('without-config'));
	const withSchemaConfig = stripAllRenderFn(await getCollection('with-schema-config'));
	const withSlugConfig = stripAllRenderFn(await getCollection('with-slug-config'));
	return {
		body: devalue.stringify({withoutConfig, withSchemaConfig, withSlugConfig}),
	}
}
