// Note: The code in this file is based on `micromark-extension-mdxjs`
// and was adapted to use our fork `@astrojs/micromark-extension-mdx-jsx`
// instead of `micromark-extension-mdx-jsx` to allow some extended syntax.
// See `@astrojs/micromark-extension-mdx-jsx` on NPM for more details.

import { Parser } from 'acorn';
import acornJsx from 'acorn-jsx';
import { combineExtensions } from 'micromark-util-combine-extensions';
import { mdxExpression } from 'micromark-extension-mdx-expression';
import { mdxJsx } from '@astrojs/micromark-extension-mdx-jsx';
import { mdxMd } from 'micromark-extension-mdx-md';
import { mdxjsEsm } from 'micromark-extension-mdxjs-esm';
import type { Options } from 'micromark-extension-mdx-expression';
import type { Extension } from 'micromark-util-types';

export function mdxjs(options: Options): Extension {
	const settings: any = Object.assign(
		{
			acorn: Parser.extend(acornJsx()),
			acornOptions: { ecmaVersion: 2020, sourceType: 'module' },
			addResult: true
		},
		options
	);

	return combineExtensions([
		mdxjsEsm(settings),
		mdxExpression(settings),
		mdxJsx(settings),
		mdxMd
	]);
}
