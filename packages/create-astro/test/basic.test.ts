import { test, expect } from 'vitest';
import 'cli-testing-library/extend-expect';
import { run } from './util';

test('full interactive', async () => {
	const { findByText, userEvent } = await run('--dry-run')
	
	expect(await findByText('Where should we create your new project?')).toBeInTheConsole();

	expect(await findByText('./')).toBeInTheConsole()

	userEvent.keyboard('foobar')
	expect(await findByText('foobar')).toBeInTheConsole()

	userEvent.keyboard('[Enter]')
	expect(await findByText('./foobar')).toBeInTheConsole()

	expect(await findByText('How would you like to start your new project?')).toBeInTheConsole()

	userEvent.keyboard('[Enter]')

	expect(await findByText('Install dependencies?')).toBeInTheConsole()

	userEvent.keyboard('[Enter]')

	expect(await findByText('Initialize a new git repository?')).toBeInTheConsole()

	userEvent.keyboard('[Enter]')

	expect(await findByText('Customize TypeScript?')).toBeInTheConsole()

	userEvent.keyboard('[Enter]')

	expect(await findByText('Liftoff confirmed')).toBeInTheConsole()
})

test('--yes', async () => {
	const { findByText } = await run('foobar --template minimal --dry-run -y')

	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	expect(await findByText('Skipping dependency installation')).toBeInTheConsole();
	expect(await findByText('Skipping Git initialization')).toBeInTheConsole();
	expect(await findByText('Using strict TypeScript configuration')).toBeInTheConsole();
	expect(await findByText('Liftoff confirmed')).toBeInTheConsole();
})

test('--no', async () => {
	const { findByText } = await run('foobar --template minimal --dry-run -n')

	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	expect(await findByText('Skipping dependency installation')).toBeInTheConsole();
	expect(await findByText('Skipping Git initialization')).toBeInTheConsole();
	expect(await findByText('Using strict TypeScript configuration')).toBeInTheConsole();
	expect(await findByText('Liftoff confirmed')).toBeInTheConsole();
})
