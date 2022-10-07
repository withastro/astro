import { test, expect } from 'vitest';
import 'cli-testing-library/extend-expect';
import { run, type } from './util';

test('interactive', async () => {
	const { findByText, userEvent } = await run('--dry-run')
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	expect(await findByText('Where should we create your new project?')).toBeInTheConsole();
	expect(await findByText('./')).toBeInTheConsole()

	type(userEvent, 'foobar')
	userEvent.keyboard('[Enter]')

	expect(await findByText('./foobar')).toBeInTheConsole()
})

test('override', async () => {
	const { findByText } = await run('foobar --dry-run')
	
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('How would you like to start your new project?')).toBeInTheConsole()
})

test('nonempty directory', async () => {
	const { findByText, userEvent } = await run('--dry-run')
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	expect(await findByText('Where should we create your new project?')).toBeInTheConsole();
	expect(await findByText('./')).toBeInTheConsole()

	type(userEvent, 'test/fixtures/nonempty-dir')
	userEvent.keyboard('[Enter]')

	expect(await findByText('Directory is not empty!')).toBeInTheConsole()
})

test('nonempty safe directory', async () => {
	const { findByText, userEvent } = await run('--dry-run')
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	expect(await findByText('Where should we create your new project?')).toBeInTheConsole();
	expect(await findByText('./')).toBeInTheConsole()

	type(userEvent, 'test/fixtures/nonempty-safe-dir')

	userEvent.keyboard('[Enter]')

	expect(await findByText('How would you like to start your new project?')).toBeInTheConsole()
})
