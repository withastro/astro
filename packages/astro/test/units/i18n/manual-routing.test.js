import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	normalizeTheLocale,
	normalizeThePath,
	pathHasLocale,
	requestHasLocale,
	redirectToDefaultLocale,
	notFound,
	redirectToFallback,
} from '../../../dist/i18n/index.js';
import { REROUTE_DIRECTIVE_HEADER } from '../../../dist/core/constants.js';
import { createManualRoutingContext, createMiddlewarePayload } from './test-helpers.js';

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
			const locales = [{ path: 'spanish', codes: ['es', 'es-ar'] }];
			assert.equal(pathHasLocale('/spanish', locales), true);
		});

		it('should match locale object in nested path', () => {
			const locales = [{ path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/spanish/blog', locales), true);
			assert.equal(pathHasLocale('/spanish/blog/post', locales), true);
		});

		it('should not match locale codes, only path', () => {
			const locales = [{ path: 'spanish', codes: ['es', 'es-ar'] }];
			assert.equal(pathHasLocale('/es', locales), false);
			assert.equal(pathHasLocale('/es-ar', locales), false);
		});

		it('should match multiple locale objects', () => {
			const locales = [
				{ path: 'spanish', codes: ['es'] },
				{ path: 'portuguese', codes: ['pt'] },
			];
			assert.equal(pathHasLocale('/spanish', locales), true);
			assert.equal(pathHasLocale('/portuguese', locales), true);
		});
	});

	describe('mixed locales', () => {
		it('should match string locale in mixed array', () => {
			const locales = ['en', { path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/en/blog', locales), true);
		});

		it('should match object locale in mixed array', () => {
			const locales = ['en', { path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/spanish/blog', locales), true);
		});

		it('should not match undefined locale', () => {
			const locales = ['en', { path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/pt', locales), false);
			assert.equal(pathHasLocale('/fr/blog', locales), false);
		});

		it('should work with complex mixed config', () => {
			const locales = [
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
			const locales = [{ path: 'spanish', codes: ['es'] }];
			assert.equal(pathHasLocale('/spanish.html', locales), true);
		});

		it('should match nested paths with .html', () => {
			assert.equal(pathHasLocale('/en/blog.html', ['en']), true);
			assert.equal(pathHasLocale('/es/about/us.html', ['es']), true);
		});

		it('should strip .html before checking locale', () => {
			const locales = [{ path: 'spanish', codes: ['es'] }];
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
			const locales = [{ path: 'spanish', codes: ['es'] }];
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

describe('requestHasLocale', () => {
	it('should return a function', () => {
		const hasLocale = requestHasLocale(['en', 'es']);
		assert.equal(typeof hasLocale, 'function');
	});

	it('should check context.url.pathname for locale', () => {
		const hasLocale = requestHasLocale(['en', 'es']);
		const context = createManualRoutingContext({ pathname: '/en/blog' });
		assert.equal(hasLocale(context), true);
	});

	it('should return true for paths with configured locales', () => {
		const hasLocale = requestHasLocale(['en', 'es', 'pt']);

		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/en' })), true);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/es/about' })), true);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/pt/blog/post' })), true);
	});

	it('should return false for paths without locales', () => {
		const hasLocale = requestHasLocale(['en', 'es']);

		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/blog' })), false);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/about' })), false);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/' })), false);
	});

	it('should work with locale objects', () => {
		const hasLocale = requestHasLocale(['en', { path: 'spanish', codes: ['es', 'es-ar'] }]);

		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/en' })), true);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/spanish' })), true);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/es' })), false);
	});

	it('should not modify context', () => {
		const hasLocale = requestHasLocale(['en']);
		const context = createManualRoutingContext({ pathname: '/en/blog' });
		const originalPathname = context.url.pathname;

		hasLocale(context);

		assert.equal(context.url.pathname, originalPathname);
	});

	it('should handle different hostnames', () => {
		const hasLocale = requestHasLocale(['en', 'es']);

		const context1 = createManualRoutingContext({ pathname: '/en', hostname: 'localhost' });
		const context2 = createManualRoutingContext({ pathname: '/en', hostname: '127.0.0.1' });

		assert.equal(hasLocale(context1), true);
		assert.equal(hasLocale(context2), true);
	});

	it('should work consistently across multiple calls', () => {
		const hasLocale = requestHasLocale(['en', 'es']);
		const context = createManualRoutingContext({ pathname: '/en/blog' });

		assert.equal(hasLocale(context), true);
		assert.equal(hasLocale(context), true);
		assert.equal(hasLocale(context), true);
	});
});

describe('redirectToDefaultLocale', () => {
	describe('basic redirect generation', () => {
		it('should create a function that returns a Response', () => {
			const payload = createMiddlewarePayload({
				defaultLocale: 'en',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.ok(response instanceof Response);
		});

		it('should redirect to default locale with no base', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.status, 302);
			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should use default status 302', () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.status, 302);
		});
	});

	describe('custom status codes', () => {
		it('should accept custom status code 301', () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 301);

			assert.equal(response.status, 301);
			// Default payload has trailingSlash: 'ignore' + format: 'directory'
			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should accept custom status code 307', () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 307);

			assert.equal(response.status, 307);
		});

		it('should accept custom status code 308', () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 308);

			assert.equal(response.status, 308);
		});
	});

	describe('base path handling', () => {
		it('should redirect to base + locale', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/blog/en/');
		});

		it('should handle base with leading slash', () => {
			const payload = createMiddlewarePayload({
				base: '/my-site',
				defaultLocale: 'pt',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/my-site/pt/');
		});

		it('should handle base with trailing slash', () => {
			const payload = createMiddlewarePayload({
				base: '/blog/',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// joinPaths normalizes, then trailingSlash: 'ignore' + format: 'directory' adds /
			assert.equal(response.headers.get('Location'), '/blog/en/');
		});

		it('should handle complex base paths', () => {
			const payload = createMiddlewarePayload({
				base: '/sites/my-app',
				defaultLocale: 'es',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/sites/my-app/es/');
		});
	});

	describe('trailing slash behavior', () => {
		it('should add trailing slash with trailingSlash: always and format: directory', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'always',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should not add trailing slash with trailingSlash: never', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'never',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.headers.get('Location'), '/en');
		});

		it('should add trailing slash with trailingSlash: ignore and format: directory', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should add trailing slash with trailingSlash: always and format: file', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'always',
				format: 'file',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should not add trailing slash with trailingSlash: never and format: file', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'never',
				format: 'file',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.headers.get('Location'), '/en');
		});
	});

	describe('combined scenarios', () => {
		it('should handle base + trailing slash + status code', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				defaultLocale: 'pt',
				trailingSlash: 'always',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 301);

			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/blog/pt/');
		});

		it('should handle complex locale codes', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'es-AR',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/es-AR/');
		});

		it('should work with underscore locales', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en_US',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/en_US/');
		});

		it('should handle all parameters combined', () => {
			const payload = createMiddlewarePayload({
				base: '/sites/app',
				defaultLocale: 'pt-BR',
				trailingSlash: 'always',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 307);

			assert.equal(response.status, 307);
			assert.equal(response.headers.get('Location'), '/sites/app/pt-BR/');
		});
	});

	describe('context independence', () => {
		it('should work regardless of context pathname', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);

			// All should redirect to the same place
			const response1 = redirect(createManualRoutingContext({ pathname: '/' }));
			const response2 = redirect(createManualRoutingContext({ pathname: '/about' }));
			const response3 = redirect(createManualRoutingContext({ pathname: '/blog/post' }));

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response1.headers.get('Location'), '/en/');
			assert.equal(response2.headers.get('Location'), '/en/');
			assert.equal(response3.headers.get('Location'), '/en/');
		});
	});
});

describe('notFound', () => {
	describe('basic 404 for non-locale paths', () => {
		it('should return 404 Response for paths without locale', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.ok(response instanceof Response);
			assert.equal(response.status, 404);
		});

		it('should return 404 for /about with configured locales', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/about' });

			const response = notFoundFn(context);

			assert.equal(response.status, 404);
		});

		it('should set REROUTE_DIRECTIVE_HEADER to no', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.equal(response.headers.get(REROUTE_DIRECTIVE_HEADER), 'no');
		});
	});

	describe('root path handling', () => {
		it('should return undefined for / (root)', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = notFoundFn(context);

			assert.equal(response, undefined);
		});

		it('should return undefined for base path as root', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.equal(response, undefined);
		});

		it('should return undefined for base path with trailing slash', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog/' });

			const response = notFoundFn(context);

			assert.equal(response, undefined);
		});
	});

	describe('locale paths allowed', () => {
		it('should return undefined for valid locale paths', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);

			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/en/blog' })), undefined);
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/es/about' })), undefined);
		});

		it('should return undefined for locale object paths', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: [{ path: 'spanish', codes: ['es'] }],
			});
			const notFoundFn = notFound(payload);

			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/spanish' })), undefined);
			assert.equal(
				notFoundFn(createManualRoutingContext({ pathname: '/spanish/blog' })),
				undefined,
			);
		});

		it('should return undefined for mixed locale config', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', { path: 'spanish', codes: ['es'] }],
			});
			const notFoundFn = notFound(payload);

			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/en' })), undefined);
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/spanish' })), undefined);
		});
	});

	describe('response parameter handling', () => {
		it('should preserve body when Response is passed', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('Original body', { status: 200 });

			const response = notFoundFn(context, originalResponse);

			assert.equal(response.status, 404);
			assert.equal(response.body, originalResponse.body);
		});

		it('should copy headers when Response is passed', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('body', {
				status: 200,
				headers: { 'X-Custom': 'value' },
			});

			const response = notFoundFn(context, originalResponse);

			assert.equal(response.status, 404);
			assert.equal(response.headers.get('X-Custom'), 'value');
		});

		it('should override status to 404 when Response is passed', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('body', { status: 200 });

			const response = notFoundFn(context, originalResponse);

			assert.equal(response.status, 404);
		});

		it('should set REROUTE_DIRECTIVE_HEADER on passed Response', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('body');

			const response = notFoundFn(context, originalResponse);

			assert.equal(response.headers.get(REROUTE_DIRECTIVE_HEADER), 'no');
		});

		it('should return original response when REROUTE_DIRECTIVE_HEADER is no and no fallback', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
				fallback: undefined,
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('body', {
				headers: { [REROUTE_DIRECTIVE_HEADER]: 'no' },
			});

			const response = notFoundFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});
	});

	describe('fallback configuration', () => {
		it('should still return 404 for non-locale paths with fallback configured', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
				fallback: { es: 'en' },
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.equal(response.status, 404);
		});

		it('should not return original response with fallback when REROUTE_DIRECTIVE_HEADER is no', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
				fallback: { es: 'en' },
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('body', {
				headers: { [REROUTE_DIRECTIVE_HEADER]: 'no' },
			});

			const response = notFoundFn(context, originalResponse);

			// With fallback defined, it should not return the original
			assert.notEqual(response, originalResponse);
			assert.equal(response.status, 404);
		});
	});

	describe('base path handling', () => {
		it('should return 404 for non-locale paths with base', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog/about' });

			const response = notFoundFn(context);

			assert.equal(response.status, 404);
		});

		it('should allow locale paths with base', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);

			assert.equal(
				notFoundFn(createManualRoutingContext({ pathname: '/blog/en/about' })),
				undefined,
			);
			assert.equal(
				notFoundFn(createManualRoutingContext({ pathname: '/blog/es/post' })),
				undefined,
			);
		});

		it('should return 404 for paths without locale under base', () => {
			const payload = createMiddlewarePayload({
				base: '/site',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);

			const response = notFoundFn(createManualRoutingContext({ pathname: '/site/contact' }));

			assert.equal(response.status, 404);
		});
	});

	describe('edge cases', () => {
		it('should handle empty pathname', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '' });

			// Empty pathname is treated as root
			const response = notFoundFn(context);

			// Based on implementation, empty string might be treated as root
			assert.ok(response === undefined || response.status === 404);
		});

		it('should handle case sensitivity in locale matching', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);

			// Normalized matching
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/EN' })), undefined);
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/Es' })), undefined);
		});

		it('should work with single locale', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en'],
			});
			const notFoundFn = notFound(payload);

			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/en' })), undefined);
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/es' })).status, 404);
		});

		it('should return null body for 404 without passed Response', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.equal(response.body, null);
		});
	});
});

describe('redirectToFallback', () => {
	describe('basic fallback behavior', () => {
		it('should return original response when status < 300', async () => {
			const payload = createMiddlewarePayload({
				fallback: { es: 'en' },
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/about' });
			const originalResponse = new Response('Content', { status: 200 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});

		it('should redirect when status >= 300 and locale has fallback', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es', 'fr'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/about' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/about');
		});

		it('should return original response when no fallback configured', async () => {
			const payload = createMiddlewarePayload({
				fallback: undefined,
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/about' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});

		it('should return original response when locale not in fallback config', async () => {
			const payload = createMiddlewarePayload({
				fallback: { es: 'en' },
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/fr/about' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});
	});

	describe('fallbackType: redirect', () => {
		it('should redirect to fallback locale', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es', 'fr'],
				defaultLocale: 'en',
				fallback: { es: 'fr' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/blog/post' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/fr/blog/post');
		});

		it('should remove default locale prefix with prefix-other-locales strategy', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-other-locales',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/about' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/about');
		});

		it('should handle base path correctly', async () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-other-locales',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/blog/es/post' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/blog/post');
		});

		it('should preserve query string', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/search?q=test' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/search?q=test');
		});

		it('should handle 3xx status codes', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page' });
			const originalResponse = new Response(null, { status: 301 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
		});

		it('should handle 4xx status codes', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page' });
			const originalResponse = new Response(null, { status: 403 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
		});

		it('should handle 5xx status codes', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page' });
			const originalResponse = new Response(null, { status: 500 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
		});
	});

	describe('fallbackType: rewrite', () => {
		it('should rewrite to fallback locale', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es', 'fr'],
				defaultLocale: 'en',
				fallback: { es: 'fr' },
				fallbackType: 'rewrite',
			});
			const fallbackFn = redirectToFallback(payload);

			// Mock context.rewrite
			const context = {
				...createManualRoutingContext({ pathname: '/es/blog/post' }),
				rewrite: async (path) => {
					return new Response(null, {
						status: 200,
						headers: { 'X-Rewrite-Path': path },
					});
				},
			};
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 200);
			assert.equal(response.headers.get('X-Rewrite-Path'), '/fr/blog/post');
		});

		it('should preserve query string in rewrite', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'rewrite',
			});
			const fallbackFn = redirectToFallback(payload);

			const context = {
				...createManualRoutingContext({ pathname: '/es/search?q=test&lang=es' }),
				rewrite: async (path) => {
					return new Response(null, {
						headers: { 'X-Rewrite-Path': path },
					});
				},
			};
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('X-Rewrite-Path'), '/search?q=test&lang=es');
		});

		it('should remove default locale prefix with prefix-other-locales strategy', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-other-locales',
				fallback: { es: 'en' },
				fallbackType: 'rewrite',
			});
			const fallbackFn = redirectToFallback(payload);

			const context = {
				...createManualRoutingContext({ pathname: '/es/about' }),
				rewrite: async (path) => {
					return new Response(null, {
						headers: { 'X-Rewrite-Path': path },
					});
				},
			};
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('X-Rewrite-Path'), '/about');
		});
	});

	describe('locale extraction from pathname', () => {
		it('should find locale in first segment', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/blog' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.notEqual(response, originalResponse);
			assert.equal(response.status, 302);
		});

		it('should handle locale objects with path', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', { path: 'spanish', codes: ['es'] }],
				defaultLocale: 'en',
				fallback: { spanish: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/spanish/blog' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/blog');
		});

		it('should handle fallback to non-default locale', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es', 'fr'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-always',
				fallback: { es: 'fr' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/fr/page');
		});
	});

	describe('edge cases', () => {
		it('should handle root path with locale', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			// When replacing /es with empty string, we get empty path
			assert.equal(response.headers.get('Location'), '');
		});

		it('should handle deep nested paths', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/blog/2024/post/title' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/blog/2024/post/title');
		});

		it('should handle base path without trailing slash', async () => {
			const payload = createMiddlewarePayload({
				base: '/site',
				locales: ['en', 'es'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-other-locales',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/site/es/page' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/site/page');
		});

		it('should not fallback when locale is not found in path', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/blog/post' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});

		it('should handle empty query string', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page?' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			// context.url.search is empty for '?', so query string is not preserved
			assert.equal(response.headers.get('Location'), '/page');
		});
	});
});
