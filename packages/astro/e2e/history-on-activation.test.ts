import { type Page, expect } from '@playwright/test';
import { type DevServer, testFactory, warmupDevServer } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/view-transitions/' });
let devServer: DevServer;

declare global {
	interface Window {
		historyAudit: {
			pushes: { active: boolean; url: string }[];
			navigate: (url: string, options?: any) => Promise<void>;
			release?: () => void;
			releasePost?: () => void;
		};
	}
}

test.beforeAll(async ({ astro, browser }) => {
	devServer = await astro.startDevServer();
	await warmupDevServer(browser, astro.resolveUrl('/history-activation'));
});
test.afterAll(async () => {
	await devServer.stop();
});

test.beforeEach(async ({ page, astro }) => {
	if (process.env.ASTRO_TEST_ROUTER_FALLBACK === '1') {
		await page.addInitScript(() => {
			Object.defineProperty(document, 'startViewTransition', { value: undefined });
		});
	}
	// Model activation expiring at the end of event dispatch, rather than the
	// much longer desktop activation window. This is not an iOS browser test.
	await page.addInitScript(() => {
		let active = false;
		Object.defineProperty(navigator, 'userActivation', {
			value: {
				get isActive() {
					return active;
				},
			},
		});
		window.historyAudit = { pushes: [], navigate: async () => {} };
		for (const type of ['click', 'submit']) {
			document.addEventListener(
				type,
				() => {
					active = true;
				},
				true,
			);
			window.addEventListener(type, () => {
				active = false;
			});
		}
		const push = history.pushState;
		history.pushState = function (state, unused, url) {
			window.historyAudit.pushes.push({
				active,
				url: new URL(url || location.href, location.href).href,
			});
			return push.call(this, state, unused, url);
		};
	});
	await page.goto(astro.resolveUrl('/history-activation'));
	await expect(page.locator('#source')).toBeVisible();
});

async function holdTwo(page: Page) {
	await page.evaluate(() => {
		document.addEventListener(
			'astro:before-preparation',
			(event: any) => {
				if (event.to.pathname !== '/two') return;
				const load = event.loader;
				event.loader = async () => {
					await new Promise<void>((resolve) => {
						window.historyAudit.release = resolve;
					});
					await load();
				};
			},
			{ once: true },
		);
	});
}
async function release(page: Page) {
	await page.evaluate(() => window.historyAudit.release?.());
}
async function length(page: Page) {
	return page.evaluate(() => history.length);
}
async function pushes(page: Page) {
	return page.evaluate(() => window.historyAudit.pushes);
}

test('reserves a single entry synchronously, then fills it without another push', async ({
	page,
}) => {
	const before = await length(page);
	await holdTwo(page);
	await page.click('#two');
	expect(await pushes(page)).toEqual([
		{ active: true, url: expect.stringContaining('/history-activation') },
	]);
	await expect(page).toHaveURL(/\/history-activation$/);
	expect(await length(page)).toBe(before + 1);
	await expect(page.locator('#source')).toBeVisible();
	await release(page);
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect((await pushes(page)).length).toBe(1);
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
	await page.goForward();
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await length(page)).toBe(before + 1);
});

test('overlapping navigations reuse the pending entry', async ({ page }) => {
	const before = await length(page);
	await holdTwo(page);
	await page.click('#two');
	await page.click('#seven');
	await expect(page.locator('#seven')).toHaveText('Page 7');
	await release(page);
	expect(await length(page)).toBe(before + 1);
	expect((await pushes(page)).length).toBe(1);
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
});

test('Back while loading aborts the fetch and Forward retains the requested destination', async ({
	page,
}) => {
	const before = await length(page);
	await holdTwo(page);
	await page.click('#two');
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
	await release(page);
	await expect(page).toHaveURL(/\/history-activation$/);
	await page.goForward();
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await length(page)).toBe(before + 1);
});

test('Back while loading returns to the displayed source without reloading it', async ({
	page,
}) => {
	const sourceRequests: string[] = [];
	page.on('request', (request) => {
		if (new URL(request.url()).pathname === '/history-activation') {
			sourceRequests.push(request.url());
		}
	});
	// Swapping in a refetched copy of the source would drop this DOM state.
	await page.evaluate(() => ((document.querySelector('#source') as any).__kept = true));
	await holdTwo(page);
	await page.click('#two');
	await page.goBack();
	await expect.poll(() => page.evaluate(() => history.state?.index)).toBe(0);
	await release(page);
	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));
	expect(sourceRequests).toEqual([]);
	expect(await page.evaluate(() => (document.querySelector('#source') as any)?.__kept)).toBe(true);
	await expect(page).toHaveURL(/\/history-activation$/);
	await page.goForward();
	await expect(page.locator('#two')).toHaveText('Page 2');
});

test('synchronous cancellation delegates to the browser without a reserved duplicate', async ({
	page,
}) => {
	const before = await length(page);
	await page.evaluate(() =>
		document.addEventListener('astro:before-preparation', (event) => event.preventDefault(), {
			once: true,
		}),
	);
	await page.click('#two');
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await length(page)).toBe(before + 1);
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
});

for (const destination of ['three', 'file']) {
	test(`full-load fallback (${destination}) does not add a second entry`, async ({ page }) => {
		const before = await length(page);
		await page.click(`#${destination}`);
		await expect(page).toHaveURL(destination === 'three' ? /\/three$/ : /\/history-target.txt$/);
		await page.waitForLoadState('load');
		expect(await length(page)).toBe(before + 1);
		await page.goBack();
		await expect(page.locator('#source')).toBeVisible();
	});
}

test('failed fetch fallback replaces the reserved entry', async ({ page }) => {
	const before = await length(page);
	await page.route('**/two', async (route) => {
		if (route.request().isNavigationRequest()) await route.continue();
		else await route.abort();
	});
	await page.click('#two');
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await length(page)).toBe(before + 1);
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
});

test('async cancellation uses a full load without a duplicate', async ({ page }) => {
	const before = await length(page);
	await page.evaluate(() =>
		document.addEventListener(
			'astro:before-preparation',
			(event: any) => {
				event.loader = async () => {
					await Promise.resolve();
					event.preventDefault();
				};
			},
			{ once: true },
		),
	);
	await page.click('#two');
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await length(page)).toBe(before + 1);
});

test('replace navigation never reserves a push', async ({ page }) => {
	const before = await length(page);
	await page.click('#replace');
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await length(page)).toBe(before);
	expect(await pushes(page)).toEqual([]);
});

test('same-page hash keeps its synchronous push and scroll behavior', async ({ page }) => {
	const before = await length(page);
	await page.click('#hash');
	await expect(page.locator('#bottom')).toBeInViewport();
	expect(await length(page)).toBe(before + 1);
	expect((await pushes(page))[0].active).toBe(true);
	await page.goBack();
	await expect(page).toHaveURL(/\/history-activation$/);
});

test('redirects replace the reserved target and preserve one entry', async ({ page }) => {
	const before = await length(page);
	await page.click('#redirect');
	await expect(page.locator('#two')).toHaveText('Page 2');
	await expect(page).toHaveURL(/\/two$/);
	expect(await length(page)).toBe(before + 1);
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
});

for (const method of ['get', 'post']) {
	test(`${method.toUpperCase()} form keeps one history entry`, async ({ page }) => {
		const before = await length(page);
		await page.click(`#${method}`);
		await expect(page.locator('#two')).toHaveText('Page 2');
		expect(await length(page)).toBe(before + 1);
		// Do not replay an in-flight POST as a GET when reloading a placeholder.
		expect((await pushes(page))[0].active).toBe(method === 'get');
		await page.goBack();
		await expect(page.locator('#source')).toBeVisible();
	});
}

async function holdPost(page: Page) {
	await page.evaluate(() => {
		document.querySelector('form[method="post"]')!.setAttribute('action', '/seven?post-only');
		document.addEventListener(
			'astro:before-preparation',
			(event: any) => {
				if (!event.formData) return;
				const load = event.loader;
				event.loader = async () => {
					await new Promise<void>((resolve) => {
						window.historyAudit.releasePost = resolve;
					});
					await load();
				};
			},
			{ once: true },
		);
	});
}

for (const interruption of ['reload', 'Back/Forward']) {
	test(`${interruption} during a POST superseding a pending GET never replays the POST as GET`, async ({
		page,
	}) => {
		const before = await length(page);
		const replayed: string[] = [];
		page.on('request', (request) => {
			if (request.method() === 'GET' && new URL(request.url()).searchParams.has('post-only')) {
				replayed.push(request.url());
			}
		});
		await holdTwo(page);
		await page.click('#two');
		await holdPost(page);
		await page.click('#post');
		if (interruption === 'reload') {
			await page.reload();
		} else {
			await page.goBack();
			await expect(page.locator('#source')).toBeVisible();
			await page.goForward();
		}
		await expect.poll(() => page.evaluate(() => history.state?.index)).toBe(1);
		await expect(page).toHaveURL(/\/history-activation$/);
		await expect(page.locator('#source')).toBeVisible();
		expect(replayed).toEqual([]);
		expect(await page.evaluate(() => history.state.__astroPending)).toBeUndefined();
		expect(await length(page)).toBe(before + 1);
	});
}

test('a POST superseding a pending GET fills its reservation on successful completion', async ({
	page,
}) => {
	const before = await length(page);
	const methods: string[] = [];
	page.on('request', (request) => {
		if (new URL(request.url()).searchParams.has('post-only')) methods.push(request.method());
	});
	await holdTwo(page);
	await page.click('#two');
	await holdPost(page);
	await page.click('#post');
	expect(await page.evaluate(() => history.state.__astroPending)).toBeUndefined();
	await page.evaluate(() => window.historyAudit.releasePost?.());
	await expect(page.locator('#seven')).toHaveText('Page 7');
	await expect(page).toHaveURL(/\/seven\?post-only$/);
	expect(methods).toEqual(['POST']);
	await release(page);
	expect(await length(page)).toBe(before + 1);
	expect((await pushes(page)).length).toBe(1);
	expect(await page.evaluate(() => history.state.__astroPending)).toBeUndefined();
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
});

test('programmatic navigation without activation keeps deferred history and custom state', async ({
	page,
}) => {
	const before = await length(page);
	await page.evaluate(() => window.historyAudit.navigate('/two', { state: { custom: 'value' } }));
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await pushes(page)).toEqual([{ active: false, url: expect.stringContaining('/two') }]);
	expect(await page.evaluate(() => history.state.custom)).toBe('value');
	expect(await length(page)).toBe(before + 1);
});

test('source scroll state and history direction survive early push', async ({ page }) => {
	await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
	await page.locator('#two').evaluate((link: HTMLElement) => link.click());
	await expect(page.locator('#two')).toHaveText('Page 2');
	await page.goBack();
	await expect(page.locator('#source')).toBeAttached();
	await expect.poll(() => page.evaluate(() => scrollY)).toBe(500);
	expect(await page.evaluate(() => history.state.index)).toBe(0);
});

for (const secondNavigation of ['link', 'form']) {
	test(`relative ${secondNavigation} during a slow fetch resolves against the old document`, async ({
		page,
		astro,
	}) => {
		await page.route('**/old/source', async (route) => {
			const response = await route.fetch({ url: astro.resolveUrl('/history-activation') });
			await route.fulfill({ response });
		});
		await page.route('**/old/sibling*', async (route) => {
			const response = await route.fetch({ url: astro.resolveUrl('/seven') });
			await route.fulfill({ response });
		});
		await page.goto(astro.resolveUrl('/old/source'));
		await page.evaluate(() => {
			document.querySelector('#two')!.setAttribute('href', '../new/slow');
			document.querySelector('#seven')!.setAttribute('href', 'sibling');
			document.querySelector('form')!.setAttribute('action', 'sibling');
			document.addEventListener(
				'astro:before-preparation',
				(event: any) => {
					event.loader = async () => {
						await new Promise<void>((resolve) => {
							window.historyAudit.release = resolve;
						});
					};
				},
				{ once: true },
			);
		});
		const before = await length(page);
		await page.click('#two');
		await expect(page).toHaveURL(/\/old\/source$/);
		await page.click(secondNavigation === 'link' ? '#seven' : '#get');
		await expect(page.locator('#seven')).toHaveText('Page 7');
		await expect(page).toHaveURL(/\/old\/sibling\??$/);
		await release(page);
		expect(await length(page)).toBe(before + 1);
	});
}

test('reload while loading completes the pending destination without a duplicate source', async ({
	page,
}) => {
	const before = await length(page);
	await holdTwo(page);
	await page.click('#two');
	await page.reload();
	await expect(page.locator('#two')).toHaveText('Page 2');
	await expect(page).toHaveURL(/\/two$/);
	expect(await length(page)).toBe(before + 1);
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
});

test('a user loader sees the current location before and after yielding', async ({ page }) => {
	await page.evaluate(() =>
		document.addEventListener(
			'astro:before-preparation',
			(event: any) => {
				const load = event.loader;
				event.loader = async () => {
					if (!location.pathname.endsWith('/history-activation'))
						throw new Error('future URL before await');
					await new Promise((resolve) => setTimeout(resolve, 10));
					if (!location.pathname.endsWith('/history-activation'))
						throw new Error('future URL after await');
					await load();
				};
			},
			{ once: true },
		),
	);
	await page.click('#two');
	await expect(page.locator('#two')).toHaveText('Page 2');
});

test('nested navigation during before-preparation cannot reserve an abandoned entry', async ({
	page,
}) => {
	const before = await length(page);
	await page.evaluate(() =>
		document.addEventListener(
			'astro:before-preparation',
			() => {
				void window.historyAudit.navigate('/seven');
			},
			{ once: true },
		),
	);
	await page.click('#two');
	await expect(page.locator('#seven')).toHaveText('Page 7');
	expect(await length(page)).toBe(before + 1);
	expect((await pushes(page)).length).toBe(1);
});

test('activated navigation preserves caller state and removes the internal pending marker', async ({
	page,
}) => {
	await page.evaluate(() =>
		document.querySelector('#two')!.addEventListener(
			'click',
			(event) => {
				event.preventDefault();
				void window.historyAudit.navigate('/two', { state: { custom: 'activated' } });
			},
			{ once: true },
		),
	);
	await page.click('#two');
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await page.evaluate(() => history.state)).toEqual({
		custom: 'activated',
		index: 1,
		scrollX: 0,
		scrollY: 0,
	});
});

test('a programmatic replacement supersedes a pending push without a phantom entry', async ({
	page,
}) => {
	const before = await length(page);
	await holdTwo(page);
	await page.click('#two');
	await page.evaluate(() => window.historyAudit.navigate('/seven', { history: 'replace' }));
	await expect(page.locator('#seven')).toHaveText('Page 7');
	await release(page);
	expect(await length(page)).toBe(before + 1);
	expect((await pushes(page)).length).toBe(1);
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
});

test('scrolling the old document during a pending fetch is restored on Back', async ({ page }) => {
	await holdTwo(page);
	await page.click('#two');
	await page.evaluate(() => window.scrollTo({ top: 750, behavior: 'instant' }));
	await release(page);
	await expect(page.locator('#two')).toHaveText('Page 2');
	await page.goBack();
	await expect(page.locator('#source')).toBeAttached();
	await expect.poll(() => page.evaluate(() => scrollY)).toBe(750);
});

test('a rejecting loader falls back without leaving a phantom source entry', async ({ page }) => {
	const before = await length(page);
	await page.evaluate(() =>
		document.addEventListener(
			'astro:before-preparation',
			(event: any) => {
				event.loader = async () => {
					throw new Error('test loader failure');
				};
			},
			{ once: true },
		),
	);
	await page.click('#two');
	await expect(page.locator('#two')).toHaveText('Page 2');
	expect(await length(page)).toBe(before + 1);
	await page.goBack();
	await expect(page.locator('#source')).toBeVisible();
});

test('Back to a stateless entry still abandons the pending navigation', async ({ page }) => {
	await page.evaluate(() => history.replaceState(null, ''));
	await holdTwo(page);
	await page.click('#two');
	await page.goBack();
	await release(page);
	await expect(page).toHaveURL(/\/history-activation$/);
	await page.goForward();
	await expect(page.locator('#two')).toHaveText('Page 2');
});
