import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { defineLiveCollection } from 'astro/content/config';
import type { LiveLoader } from 'astro/loaders';

function assertType<T>(data: T, cb: (data: NoInfer<T>) => void) {
	cb(data);
}

interface Data {
	body: string;
}

const loader: LiveLoader<Data> = {
	name: 'test-loader',
	loadEntry: async () => ({
		id: 'hello-world',
		data: { body: 'Hello world' },
	}),
	loadCollection: async () => ({
		entries: [
			{
				id: 'hello-world',
				data: { body: 'Hello world' },
			},
		],
	}),
};

describe('defineLiveCollection()', () => {
	it('accepts live loaders whose data type is declared as an interface', () => {
		assertType(defineLiveCollection({ loader }), (config) => {
			expectTypeOf(config.loader).toEqualTypeOf<LiveLoader<Data>>();
		});
	});
});
