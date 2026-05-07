import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('CSS ordering - import order with layouts', () => {
	function getLinks(html: string): string[] {
		let $ = cheerio.load(html);
		let out: string[] = [];
		$('link[rel=stylesheet]').each((_i, el) => {
			out.push($(el).attr('href')!);
		});
		return out;
	}

	async function getLinkContent(href: string): Promise<{ href: string; css: string }> {
		const css = await fixture.readFile(href);
		return { href, css };
	}

	it('Page level CSS is defined lower in the page', async () => {
		let html = await fixture.readFile('/css-order-layout/index.html');

		const content = await Promise.all(getLinks(html).map((href) => getLinkContent(href)));

		let specialButtonCSS = -1;
		let globalCSS = -1;
		for (let i = 0; i < content.length; i++) {
			if (content[i].css.includes('.SpecialButton')) {
				specialButtonCSS = i;
			} else if (content[i].css.includes('green')) {
				globalCSS = i;
			}
		}

		assert.equal(globalCSS, 0, 'global css sorted on top');
		assert.equal(specialButtonCSS, 1, 'component level css sorted last');
	});
});
