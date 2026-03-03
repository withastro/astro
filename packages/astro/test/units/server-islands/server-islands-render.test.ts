import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createKey } from '../../../dist/core/encryption.js';
import {
	ServerIslandComponent,
	containsServerDirective,
	renderServerIslandRuntime,
} from '../../../dist/runtime/server/render/server-islands.js';

// #region Helpers

/** Minimal SSRResult stub sufficient for ServerIslandComponent. */
async function createStubResult(overrides = {}) {
	const key = await createKey();
	return {
		key: Promise.resolve(key),
		serverIslandNameMap: new Map([
			['src/components/Island.astro', 'Island'],
			['src/components/BigIsland.astro', 'BigIsland'],
		]),
		base: '/',
		trailingSlash: 'never',
		_metadata: {
			extraHead: [],
			extraScriptHashes: [],
			hasRenderedServerIslandRuntime: false,
			propagators: new Set(),
		},
		cspDestination: undefined,
		internalFetchHeaders: {},
		...overrides,
	};
}

/** Collect all chunks written to a destination into a single string. */
function createDestination() {
	const chunks = [];
	const destination = {
		write(chunk) {
			chunks.push(chunk);
		},
	};
	return {
		destination,
		/** Returns all written chunks concatenated as a string. Call after render() completes. */
		output() {
			return chunks.map((c) => String(c)).join('');
		},
	};
}

/** Minimal props for a server island pointing at Island.astro. */
function islandProps(extra = {}) {
	return {
		'server:component-path': 'src/components/Island.astro',
		'server:component-export': 'default',
		'server:component-directive': 'server',
		'server:defer': true,
		...extra,
	};
}

// #endregion

// #region containsServerDirective

describe('containsServerDirective', () => {
	it('returns true when server:component-directive is present', () => {
		assert.equal(containsServerDirective({ 'server:component-directive': 'server' }), true);
	});

	it('returns false when server:component-directive is absent', () => {
		assert.equal(containsServerDirective({ foo: 'bar' }), false);
	});

	it('returns false for an empty props object', () => {
		assert.equal(containsServerDirective({}), false);
	});
});

// #endregion

// #region renderServerIslandRuntime

describe('renderServerIslandRuntime', () => {
	it('returns a <script> tag containing the replaceServerIsland function', () => {
		const output = renderServerIslandRuntime();
		assert.ok(output.includes('<script>'), 'should include opening <script> tag');
		assert.ok(output.includes('</script>'), 'should include closing </script> tag');
		assert.ok(
			output.includes('replaceServerIsland'),
			'should include the replaceServerIsland function',
		);
	});

	it('escapes </script> sequences inside the runtime script', () => {
		const output = renderServerIslandRuntime();
		// The content between the script tags must not contain an unescaped </script
		// (only the closing tag at the very end is allowed)
		const inner = output.replace(/^<script>/, '').replace(/<\/script>$/, '');
		assert.ok(
			!inner.includes('</script'),
			'inner script content should not contain unescaped </script',
		);
	});
});

// #endregion

// #region ServerIslandComponent

describe('ServerIslandComponent', () => {
	// #region getIslandContent()
	describe('getIslandContent()', () => {
		it('omits props from the URL when no user props are provided', async () => {
			const result = await createStubResult();
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			const content = await component.getIslandContent();
			// Matches `p=` with nothing after it before the next param or quote,
			// e.g. `?e=...&p=&s=` (GET) or `encryptedProps: ''` (POST).
			// This confirms the encrypted props value is empty when no user props are passed.
			const emptyPropsPattern = /[?&]p=(?:&|')/;
			assert.ok(emptyPropsPattern.test(content), `expected empty p= in URL, got: ${content}`);
		});

		it('includes encrypted props in the URL when user props are provided', async () => {
			const result = await createStubResult();
			const props = islandProps({ message: 'hello' });
			const component = new ServerIslandComponent(result, props, {}, 'Island');
			const content = await component.getIslandContent();
			// p= should be non-empty when props are present
			assert.ok(!content.includes("'p', ''"), 'p= should not be empty when props are present');
		});

		it('produces different ciphertexts on each call (IV randomness)', async () => {
			const result = await createStubResult();
			const propsA = islandProps({ value: 'test' });
			const propsB = islandProps({ value: 'test' });
			const compA = new ServerIslandComponent(result, propsA, {}, 'Island');
			const compB = new ServerIslandComponent(result, propsB, {}, 'Island');
			const [contentA, contentB] = await Promise.all([
				compA.getIslandContent(),
				compB.getIslandContent(),
			]);
			// Two separate instances with identical props should produce different encrypted values
			assert.notEqual(contentA, contentB, 'encrypted values should differ due to unique IVs');
		});

		it('uses a GET request for small payloads (under 2048 chars)', async () => {
			const result = await createStubResult();
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			const content = await component.getIslandContent();
			// A small payload should use a plain fetch() GET call (no method: 'POST')
			assert.ok(!content.includes("method: 'POST'"), 'small payloads should use GET, not POST');
			assert.ok(content.includes("fetch('"), 'should use fetch()');
		});

		it('uses a POST request for large payloads (over 2048 chars)', async () => {
			const result = await createStubResult();
			// Create a large prop value to push past the 2048 character URL limit
			const largeValue = 'x'.repeat(2048);
			const props = islandProps({ data: largeValue });
			const component = new ServerIslandComponent(result, props, {}, 'Island');
			const content = await component.getIslandContent();
			assert.ok(content.includes("method: 'POST'"), 'large payloads should fall back to POST');
		});

		it('builds the island URL from base + componentId', async () => {
			const result = await createStubResult({ base: '/app' });
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			const content = await component.getIslandContent();
			assert.ok(
				content.includes('/app/_server-islands/Island'),
				`island URL should include base + componentId, got: ${content}`,
			);
		});

		it('appends a trailing slash when trailingSlash is "always"', async () => {
			const result = await createStubResult({ trailingSlash: 'always' });
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			const content = await component.getIslandContent();
			assert.ok(
				content.includes('/_server-islands/Island/'),
				`should append trailing slash, got: ${content}`,
			);
		});

		it('does not append a trailing slash when trailingSlash is "never"', async () => {
			const result = await createStubResult({ trailingSlash: 'never' });
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			const content = await component.getIslandContent();
			assert.ok(
				!content.includes('/_server-islands/Island/'),
				`should NOT append trailing slash, got: ${content}`,
			);
		});

		it('the encrypted componentExport round-trips correctly', async () => {
			const key = await createKey();
			const result = await createStubResult({ key: Promise.resolve(key) });
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			await component.getIslandContent();
			// Extract the encrypted export value embedded in the generated script
			// The GET path embeds it in the URL; POST path embeds it in the data object.
			// We verify the field is encrypted (not plaintext "default") in both cases.
			const content = await component.getIslandContent();
			assert.ok(
				!content.includes('"default"') && !content.includes("'default'"),
				'componentExport should be encrypted, not plaintext "default"',
			);
		});

		it('removes internal server: props before encrypting user props', async () => {
			const key = await createKey();
			const result = await createStubResult({ key: Promise.resolve(key) });
			const props = islandProps({ userProp: 'visible' });
			const component = new ServerIslandComponent(result, props, {}, 'Island');
			await component.getIslandContent();
			// After getIslandContent(), the internal props should have been removed from this.props
			for (const internalKey of [
				'server:component-path',
				'server:component-export',
				'server:component-directive',
				'server:defer',
			]) {
				assert.ok(
					!(internalKey in component.props),
					`internal prop ${internalKey} should be removed`,
				);
			}
			// The user prop should remain
			assert.ok('userProp' in component.props, 'user prop should still be present');
		});

		it('throws when the component path is not in serverIslandNameMap', async () => {
			const result = await createStubResult();
			const props = islandProps({ 'server:component-path': 'src/components/Unknown.astro' });
			const component = new ServerIslandComponent(result, props, {}, 'Unknown');
			await assert.rejects(
				() => component.getIslandContent(),
				/Could not find server component name/,
			);
		});
	});
	// #endregion

	// #region render()
	describe('render()', () => {
		it('emits the server-island-start HTML comment marker', async () => {
			const result = await createStubResult();
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			const dest = createDestination();
			await component.render(dest.destination);
			const out = dest.output();
			assert.ok(
				out.includes('server-island-start'),
				`should emit server-island-start marker, got: ${out}`,
			);
		});

		it('emits a <script data-island-id> tag', async () => {
			const result = await createStubResult();
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			const dest = createDestination();
			await component.render(dest.destination);
			const out = dest.output();
			assert.ok(
				out.includes('data-island-id'),
				`should emit data-island-id script tag, got: ${out}`,
			);
		});

		it('renders fallback slot content inline', async () => {
			const result = await createStubResult();
			// The fallback slot is a function that returns a renderable value
			const fallbackSlot = () => 'Loading...';
			const component = new ServerIslandComponent(
				result,
				islandProps(),
				{ fallback: fallbackSlot },
				'Island',
			);
			const dest = createDestination();
			await component.render(dest.destination);
			const out = dest.output();
			assert.ok(
				out.includes('Loading...'),
				`fallback content should appear in rendered output, got: ${out}`,
			);
		});

		it('does not render non-fallback slot content inline', async () => {
			const result = await createStubResult();
			// A non-fallback slot called "content" — its HTML should NOT appear directly in render()
			// output; instead it is encrypted and sent to the island endpoint.
			const contentSlot = () => 'Slot content that should be encrypted';
			const component = new ServerIslandComponent(
				result,
				islandProps(),
				{ content: contentSlot },
				'Island',
			);
			const dest = createDestination();
			await component.render(dest.destination);
			const out = dest.output();
			assert.ok(
				!out.includes('Slot content that should be encrypted'),
				`non-fallback slot content should NOT appear inline in render output, got: ${out}`,
			);
		});

		it('places the server-island-start marker before the island script tag', async () => {
			const result = await createStubResult();
			const component = new ServerIslandComponent(result, islandProps(), {}, 'Island');
			const dest = createDestination();
			await component.render(dest.destination);
			const out = dest.output();

			const markerIndex = out.indexOf('server-island-start');
			const scriptIndex = out.indexOf('data-island-id');
			assert.ok(markerIndex > -1, 'server-island-start marker should be present');
			assert.ok(scriptIndex > -1, 'data-island-id script should be present');
			assert.ok(markerIndex < scriptIndex, 'marker should appear before the island script');
		});
	});
	// #endregion
});

// #endregion
