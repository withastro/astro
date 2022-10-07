import { render } from 'cli-testing-library'
import { fileURLToPath } from 'url';

export function run(flags?: string) {
	return render('node', ['./create-astro.mjs', '--skip-houston', ...(flags ? flags.split(' ') : [])], { cwd: fileURLToPath(new URL('../', import.meta.url)) })
}

export function type(userEvent, value: string) {
	userEvent.keyboard(value, { keyboardMap: value.split('').map(hex => ({ hex })) })
}
