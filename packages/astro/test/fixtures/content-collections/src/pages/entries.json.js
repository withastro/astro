import { getEntry } from 'astro:content';
import * as devalue from 'devalue';
import { stripRenderFn } from '../utils.js';

export async function get() {
	const columbiaWithoutConfig = stripRenderFn(await getEntry('without-config', 'columbia.md'));
	const oneWithSchemaConfig = stripRenderFn(await getEntry('with-schema-config', 'one.md'));
	const twoWithSlugConfig = stripRenderFn(await getEntry('with-slug-config', 'two.md'));
	const postWithUnionSchema = stripRenderFn(await getEntry('with-union-schema', 'post.md'));

	return {
		body: devalue.stringify({columbiaWithoutConfig, oneWithSchemaConfig, twoWithSlugConfig, postWithUnionSchema}),
	}
}
