import * as xml2js from 'xml2js';
import {
	type AstroInlineConfig,
	type Fixture,
	loadFixture as baseLoadFixture,
} from 'astro/_internal/test/test-utils';

export type { AstroInlineConfig, Fixture };

export function loadFixture(inlineConfig: AstroInlineConfig): Promise<Fixture> {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root as string, import.meta.url).toString(),
	});
}

export function readXML(fileOrPromise: string | Promise<string>): Promise<any> {
	const parseString = xml2js.parseString;
	return Promise.resolve(fileOrPromise).then((xml) => {
		return new Promise((resolve, reject) => {
			parseString(xml, function (err, result) {
				if (err) return reject(err);
				resolve(result);
			});
		});
	});
}
