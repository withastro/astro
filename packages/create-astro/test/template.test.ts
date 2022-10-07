import { test, expect } from 'vitest';
import 'cli-testing-library/extend-expect';
import { run, type } from './util';

test('override', async () => {
	const { findByText } = await run('foobar --template minimal --dry-run')
	
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
})

test('override external', async () => {
	const { findByText } = await run('foobar --template cassidoo/shopify-react-astro --dry-run')
	
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using cassidoo/shopify-react-astro as project template')).toBeInTheConsole();
})

test('select', async () => {
	const { findByText, userEvent } = await run('--dry-run')
	
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	const where = await findByText('Where should we create your new project?');
	expect(where).toBeInTheConsole();

	expect(await findByText('./')).toBeInTheConsole()

	type(userEvent, 'test/fixtures/empty-dir')
	userEvent.keyboard('[Enter]')

	expect(await findByText('How would you like to start your new project?')).toBeInTheConsole()

	expect(await findByText('● Include sample files')).toBeInTheConsole()

	userEvent.keyboard('[ArrowDown]')

	expect(await findByText('● Use blog template')).toBeInTheConsole()

	userEvent.keyboard('[ArrowDown]')

	expect(await findByText('● Empty')).toBeInTheConsole()

	userEvent.keyboard('[Enter]')

	expect(await findByText('Install dependencies?')).toBeInTheConsole()
})
