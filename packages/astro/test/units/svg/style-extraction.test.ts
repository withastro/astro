import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeSvgComponent } from '../../../dist/assets/svg/utils.js';

/** Minimal ImageMetadata stub with only the fields makeSvgComponent reads. */
function meta(fsPath: string) {
	return { src: '/test.svg', width: 24, height: 24, format: 'svg', fsPath } as any;
}

/** Extract the `styles` array from the generated module source. */
function extractStyles(moduleSource: string): string[] {
	// The module exports `createSvgComponent({...props...})`.
	// We eval just the JSON argument to read the `styles` property.
	const match = /createSvgComponent\((.+)\)$/s.exec(moduleSource);
	assert.ok(match, 'expected createSvgComponent call in module source');
	const props = JSON.parse(match[1]);
	return props.styles;
}

describe('SVG style extraction', () => {
	it('collects <style> as a direct child of <svg>', async () => {
		const svg = '<svg viewBox="0 0 24 24"><style>.a{fill:red}</style><rect/></svg>';
		const source = await makeSvgComponent(meta('/test.svg'), svg, undefined);
		const styles = extractStyles(source);
		assert.equal(styles.length, 1);
		assert.equal(styles[0], '.a{fill:red}');
	});

	it('collects <style> nested inside <defs>', async () => {
		const svg = '<svg viewBox="0 0 24 24"><defs><style>.a{fill:red}</style></defs><rect/></svg>';
		const source = await makeSvgComponent(meta('/test.svg'), svg, undefined);
		const styles = extractStyles(source);
		assert.equal(styles.length, 1);
		assert.equal(styles[0], '.a{fill:red}');
	});

	it('collects <style> nested multiple levels deep', async () => {
		const svg =
			'<svg viewBox="0 0 24 24"><defs><g><style>.a{fill:red}</style></g></defs><rect/></svg>';
		const source = await makeSvgComponent(meta('/test.svg'), svg, undefined);
		const styles = extractStyles(source);
		assert.equal(styles.length, 1);
		assert.equal(styles[0], '.a{fill:red}');
	});

	it('collects multiple <style> elements at different nesting levels', async () => {
		const svg = [
			'<svg viewBox="0 0 24 24">',
			'<style>.a{fill:red}</style>',
			'<defs><style>.b{fill:blue}</style></defs>',
			'<rect/>',
			'</svg>',
		].join('');
		const source = await makeSvgComponent(meta('/test.svg'), svg, undefined);
		const styles = extractStyles(source);
		assert.equal(styles.length, 2);
		assert.equal(styles[0], '.a{fill:red}');
		assert.equal(styles[1], '.b{fill:blue}');
	});

	it('returns empty styles array when no <style> elements exist', async () => {
		const svg = '<svg viewBox="0 0 24 24"><rect/></svg>';
		const source = await makeSvgComponent(meta('/test.svg'), svg, undefined);
		const styles = extractStyles(source);
		assert.equal(styles.length, 0);
	});
});
