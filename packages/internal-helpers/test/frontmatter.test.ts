import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseFrontmatter } from '../dist/frontmatter.js';
import { yamlLoad } from '../dist/yaml.js';

describe('parseFrontmatter', () => {
	it('parses YAML frontmatter', () => {
		const { frontmatter, content } = parseFrontmatter('---\ntitle: Hello\n---\nBody');
		assert.deepEqual(frontmatter, { title: 'Hello' });
		assert.equal(content, '\nBody');
	});

	it('parses unquoted dates as Date objects', () => {
		const { frontmatter } = parseFrontmatter('---\ndate: 2022-01-01\n---\n');
		assert.ok(frontmatter.date instanceof Date);
		assert.equal(frontmatter.date.toISOString(), '2022-01-01T00:00:00.000Z');
	});

	it('keeps quoted dates as strings', () => {
		const { frontmatter } = parseFrontmatter("---\ndate: '2022-01-01'\n---\n");
		assert.equal(frontmatter.date, '2022-01-01');
	});

	it('resolves merge keys', () => {
		const { frontmatter } = parseFrontmatter(
			'---\ndefaults: &defaults\n  layout: base\npage:\n  <<: *defaults\n  title: Hello\n---\n',
		);
		assert.deepEqual(frontmatter.page, { layout: 'base', title: 'Hello' });
	});

	it('returns an empty object for an empty frontmatter block', () => {
		const { frontmatter, content } = parseFrontmatter('---\n---\nBody');
		assert.deepEqual(frontmatter, {});
		assert.equal(content, '\nBody');
	});

	it('returns an empty object for a whitespace-only frontmatter block', () => {
		const { frontmatter } = parseFrontmatter('---\n  \n\n---\nBody');
		assert.deepEqual(frontmatter, {});
	});

	it('returns an empty object for a comment-only frontmatter block', () => {
		const { frontmatter } = parseFrontmatter('---\n# just a comment\n---\nBody');
		assert.deepEqual(frontmatter, {});
	});

	it('returns an empty object when there is no frontmatter', () => {
		const { frontmatter, content } = parseFrontmatter('Body');
		assert.deepEqual(frontmatter, {});
		assert.equal(content, 'Body');
	});

	it('parses TOML frontmatter', () => {
		const { frontmatter } = parseFrontmatter('+++\ntitle = "Hello"\n+++\nBody');
		assert.deepEqual(frontmatter, { title: 'Hello' });
	});
});

describe('yamlLoad', () => {
	it('parses a YAML document', () => {
		assert.deepEqual(yamlLoad('a: 1\nb: true'), { a: 1, b: true });
	});

	it('parses unquoted dates as Date objects', () => {
		const data = yamlLoad('date: 2022-01-01') as Record<string, unknown>;
		assert.ok(data.date instanceof Date);
	});

	it('returns undefined for empty input', () => {
		assert.equal(yamlLoad(''), undefined);
	});

	it('returns undefined for comment-only input', () => {
		assert.equal(yamlLoad('# just a comment'), undefined);
	});

	it('throws on multi-document input', () => {
		assert.throws(() => yamlLoad('a: 1\n---\nb: 2'), /single document/);
	});
});
