import * as cheerio from 'cheerio';
import type { Fixture } from './test-utils.ts';

export async function readPageStyles(fixture: Fixture, html: string): Promise<string> {
	const $ = cheerio.load(html);
	const styles = await Promise.all(
		$('style, link[rel="stylesheet"]')
			.toArray()
			.map((element) => {
				const href = $(element).attr('href');
				return href ? fixture.readFile(href) : $(element).text();
			}),
	);
	return styles.join('\n');
}
