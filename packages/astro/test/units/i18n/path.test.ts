import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeTheLocale, normalizeThePath, pathHasLocale } from '../../../dist/i18n/path.js';
import type { Locales } from '../../../dist/types/public/config.js';

describe('normalizeTheLocale', () => {
	it('should convert underscores to dashes', () => {
		assert.equal(normalizeTheLocale('en_US'), 'en-us');
		assert.equal(normalizeTheLocale('pt_BR'), 'pt-br');
		assert.equal(normalizeTheLocale('zh_Hans_CN'), 'zh-hans-cn');
	});

	it('should convert to lowercase', () => {
		assert.equal(normalizeTheLocale('EN'), 'en');
		assert.equal(normalizeTheLocale('ES'), 'es');
		assert.equal(normalizeTheLocale('PT'), 'pt');
	});

	it('should convert both underscores and case', () => {
		assert.equal(normalizeTheLocale('EN_US'), 'en-us');
		assert.equal(normalizeTheLocale('Es_AR'), 'es-ar');
	});

	it('should handle already normalized locales', () => {
		assert.equal(normalizeTheLocale('en-us'), 'en-us');
		assert.equal(normalizeTheLocale('en'), 'en');
		assert.equal(normalizeTheLocale('pt-br'), 'pt-br');
	});

	it('should handle edge cases', () => {
		assert.equal(normalizeTheLocale(''), '');
		assert.equal(normalizeTheLocale('a'), 'a');
	});
});

describe('normalizeThePath', () => {
	it('should remove .html extension', () => {
		assert.equal(normalizeThePath('/en/blog.html'), '/en/blog');
		assert.equal(normalizeThePath('/spanish.html'), '/spanish');
		assert.equal(normalizeThePath('en.html'), 'en');
	});

	it('should not modify paths without .html', () => {
		assert.equal(normalizeThePath('/en/blog'), '/en/blog');
		assert.equal(normalizeThePath('/spanish'), '/spanish');
		assert.equal(normalizeThePath('/'), '/');
	});

	it('should not remove other extensions', () => {
		assert.equal(normalizeThePath('/en/blog.php'), '/en/blog.php');
		assert.equal(normalizeThePath('/api.json'), '/api.json');
		assert.equal(normalizeThePath('/file.txt'), '/file.txt');
	});

	it('should handle edge cases', () => {
		assert.equal(normalizeThePath(''), '');
		assert.equal(normalizeThePath('.html'), '');
		assert.equal(normalizeThePath('a.html'), 'a');
	});
});

describe('pathHasLocale', () => {
	describe('string locales - basic matching', () => {
		it('should return true when path contains string locale', () => {
			assert.equal(pathHasLocale('/en', ['en', 'es']), true);
			assert.equal(pathHasLocale('/es', ['en', 'es']), true);
			assert.equal(pathHasLocale('/pt', ['en', 'es', 'pt']), true);
		});

		it('should return true when path contains locale in nested path', () => {
			assert.equal(pathHasLocale('/en/about', ['en', 'es']), true);
			assert.equal(pathHasLocale('/es/blog/post', ['en', 'es']), true);
			assert.equal(pathHasLocale('/pt/nested/deep/path', ['pt']), true);
		});

		it('should return false when path does not contain locale', () => {
			assert.equal(pathHasLocale('/fr', ['en', 'es']), false);
			assert.equal(pathHasLocale('/about', ['en', 'es']), false);
			assert.equal(pathHasLocale('/blog/post', ['en', 'es']), false);
		});

		it('should return false for root path', () => {
			assert.equal(pathHasLocale('/', ['en', 'es']), false);
		});
	});

	describe('string locales - case insensitive matching', () => {
		it('should match locale regardless of case in path', () => {
			assert.equal(pathHasLocale('/EN', ['en']), true);
			assert.equal(pathHasLocale('/En', ['en']), true);
			assert.equal(pathHasLocale('/eN', ['en']), true);
		});

		it('should match locale regardless of case in config', () => {
			assert.equal(pathHasLocale('/en', ['EN']), true);
			assert.equal(pathHasLocale('/en', ['En']), true);
		});

		it('should handle underscore to dash normalization in path', () => {
			assert.equal(pathHasLocale('/en_US', ['en-us']), true);
			assert.equal(pathHasLocale('/pt_BR', ['pt-br']), true);
		});

		it('should handle dash to underscore normalization in config', () => {
			assert.equal(pathHasLocale('/en-us', ['en_US']), true);
			assert.equal(pathHasLocale('/pt-br', ['pt_BR']), true);
		});

		it('should handle mixed case and separators', () => {
			assert.equal(pathHasLocale('/EN_us', ['en-US']), true);
			assert.equal(pathHasLocale('/pt-BR', ['PT_br']), true);
		});
	});

	describe('object locales - path matching', () => {
		it('should match locale object by path', () => {
			const locales: Locales = [{ path: 'spanish', codes: ['es', 'es-ar'] }];
			assert.equal(pathHasLocale('/spanish', locales), true);
		});

		it('should match locale object in nested path', () => {
			const locales: Locales = [{ path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/spanish/blog', locales), true);
			assert.equal(pathHasLocale('/spanish/blog/post', locales), true);
		});

		it('should not match locale codes, only path', () => {
			const locales: Locales = [{ path: 'spanish', codes: ['es', 'es-ar'] }];
			assert.equal(pathHasLocale('/es', locales), false);
			assert.equal(pathHasLocale('/es-ar', locales), false);
		});

		it('should match multiple locale objects', () => {
			const locales: Locales = [
				{ path: 'spanish', codes: ['es'] },
				{ path: 'portuguese', codes: ['pt'] },
			];
			assert.equal(pathHasLocale('/spanish', locales), true);
			assert.equal(pathHasLocale('/portuguese', locales), true);
		});
	});

	describe('mixed locales', () => {
		it('should match string locale in mixed array', () => {
			const locales: Locales = ['en', { path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/en/blog', locales), true);
		});

		it('should match object locale in mixed array', () => {
			const locales: Locales = ['en', { path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/spanish/blog', locales), true);
		});

		it('should not match undefined locale', () => {
			const locales: Locales = ['en', { path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/pt', locales), false);
			assert.equal(pathHasLocale('/fr/blog', locales), false);
		});

		it('should work with complex mixed config', () => {
			const locales: Locales = [
				'en',
				'fr',
				{ path: 'spanish', codes: ['es', 'es-ar'] },
				'pt',
				{ path: 'italiano', codes: ['it', 'it-va'] },
			];
			assert.equal(pathHasLocale('/en', locales), true);
			assert.equal(pathHasLocale('/fr/about', locales), true);
			assert.equal(pathHasLocale('/spanish', locales), true);
			assert.equal(pathHasLocale('/pt/blog', locales), true);
			assert.equal(pathHasLocale('/italiano', locales), true);
			assert.equal(pathHasLocale('/de', locales), false);
		});
	});

	describe('HTML extension handling (SSG)', () => {
		it('should match locale with .html extension', () => {
			assert.equal(pathHasLocale('/en.html', ['en']), true);
			assert.equal(pathHasLocale('/es.html', ['en', 'es']), true);
		});

		it('should match locale object path with .html', () => {
			const locales: Locales = [{ path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/spanish.html', locales), true);
		});

		it('should match nested paths with .html', () => {
			assert.equal(pathHasLocale('/en/blog.html', ['en']), true);
			assert.equal(pathHasLocale('/es/about/us.html', ['es']), true);
		});

		it('should strip .html before checking locale', () => {
			const locales: Locales = [{ path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/spanish.html', locales), true);
			// But not match the code
			assert.equal(pathHasLocale('/es.html', locales), false);
		});
	});

	describe('edge cases', () => {
		it('should handle root path', () => {
			assert.equal(pathHasLocale('/', ['en', 'es']), false);
		});

		it('should handle empty path', () => {
			assert.equal(pathHasLocale('', ['en', 'es']), false);
		});

		it('should handle trailing slash', () => {
			assert.equal(pathHasLocale('/en/', ['en']), true);
			assert.equal(pathHasLocale('/es/blog/', ['es']), true);
		});

		it('should handle path with only locale and trailing slash', () => {
			const locales: Locales = [{ path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/spanish/', locales), true);
		});

		it('should handle multiple consecutive slashes', () => {
			assert.equal(pathHasLocale('/en//blog', ['en']), true);
			assert.equal(pathHasLocale('//en/blog', ['en']), true);
		});

		it('should not match partial locale segments', () => {
			assert.equal(pathHasLocale('/english', ['en']), false);
			assert.equal(pathHasLocale('/item', ['it']), false);
			assert.equal(pathHasLocale('/open', ['en']), false);
		});

		it('should handle empty locales array', () => {
			assert.equal(pathHasLocale('/en', []), false);
			assert.equal(pathHasLocale('/', []), false);
		});

		it('should handle single character locales', () => {
			assert.equal(pathHasLocale('/a', ['a', 'b']), true);
			assert.equal(pathHasLocale('/b/page', ['a', 'b']), true);
		});
	});
});
