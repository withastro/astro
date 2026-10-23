import { expect } from '@playwright/test';
import { prepareTestFactory } from './test-utils.ts';

const { test } = prepareTestFactory({ root: './fixtures/demo/' });

test.describe('Scoped scripts', () => {
	test('run once per instance, scoped to that instance', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const counters = page.locator('.counter');
		await counters.nth(0).locator('.inc').click();
		await counters.nth(0).locator('.inc').click();
		await counters.nth(1).locator('.dec').click();
		await expect(counters.nth(0).locator('output')).toHaveText('2');
		await expect(counters.nth(1).locator('output')).toHaveText('9');
	});

	test('do not see child component internals, but do see slotted content', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/'));
		const card = page.locator('.card').first();
		await card.locator('header .toggle').click();
		await expect(card.locator('.body')).toBeHidden();
		await expect(card.locator('header .toggle')).toHaveText('Show');

		// Todo checkboxes also have the `toggle` class; the card's script must not grab them.
		const todosCard = page.locator('.card').nth(2);
		await todosCard.locator('li .toggle').first().check();
		await expect(todosCard.locator('.body')).toBeVisible();
	});
});

test.describe('Signals', () => {
	test('a frontmatter signal is shared between components on the client', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/'));
		await page.fill('input[type=text]', 'Ada');
		await expect(page.locator('p strong')).toHaveText('Ada');
		await expect(page.locator('p span')).toHaveText('Ada');
	});
});

test.describe('Lists', () => {
	test('adopt server-rendered rows and clone the template for new ones', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/'));
		const todos = page.locator('.todos');
		await expect(todos.locator('.remaining')).toHaveText('2 left');
		await expect(todos.locator('li').nth(1)).toHaveClass(/done/);

		await todos.locator('.add input').fill('Buy milk');
		await todos.locator('.add button').click();
		await expect(todos.locator('li .text').last()).toHaveText('Buy milk');
		await expect(todos.locator('.add input')).toHaveValue('');
		await expect(todos.locator('.remaining')).toHaveText('3 left');
	});

	test('filter, sort, remove and clear rows', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const todos = page.locator('.todos');
		await todos.locator('li .toggle').first().check();

		await todos.locator('[data-filter=done]').click();
		await expect(todos.locator('li:visible .text')).toHaveText([
			'Write the RFC',
			'Prototype <script scoped>',
		]);
		await todos.locator('[data-filter=all]').click();

		await todos.locator('.sort').click();
		await expect(todos.locator('li .text')).toHaveText([
			'Ask agents to build things with it',
			'Prototype <script scoped>',
			'Write the RFC',
		]);

		await todos.locator('li', { hasText: 'Write the RFC' }).locator('.delete').click();
		await expect(todos.locator('li')).toHaveCount(2);

		await todos.locator('.clear').click();
		await expect(todos.locator('li .text')).toHaveText(['Ask agents to build things with it']);
	});
});
