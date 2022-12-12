import { getCollection } from 'astro:content';
import * as devalue from 'devalue';

export async function get() {
	const withoutConfig = await getCollection('without-config');
	const withSchemaConfig = await getCollection('with-schema-config');
	const withSlugConfig = await getCollection('with-slug-config');
	return {
		body: devalue.stringify({withoutConfig, withSchemaConfig, withSlugConfig}),
	}
}
