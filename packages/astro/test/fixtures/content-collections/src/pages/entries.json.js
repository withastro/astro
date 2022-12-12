import { getEntry } from 'astro:content';
import * as devalue from 'devalue';

export async function get() {
	const columbiaWithoutConfig = await getEntry('without-config', 'columbia.md');
	const oneWithSchemaConfig = await getEntry('with-schema-config', 'one.md');
	const twoWithSlugConfig = await getEntry('with-slug-config', 'two.md');
	return {
		body: devalue.stringify({columbiaWithoutConfig, oneWithSchemaConfig, twoWithSlugConfig}),
	}
}
