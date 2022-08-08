import { expect, test } from 'vitest'
import { render } from 'astro/test'
import Greeting from './Greeting.astro'

test('Greeting', async () => {
	const { container } = await render(<Greeting />)
	expect(container).toBeDefined()
	expect(container.textContent).toBe('Hello world')
})

test('Greeting with name', async () => {
	const { container } = await render(<Greeting>Test</Greeting>)
	expect(container).toBeDefined()
	expect(container.textContent).toBe('Hello Test')
})

test('Greeting unenthusiastic', async () => {
	const { container } = await render(<Greeting enthusiasm={0} />)
	expect(container).toBeDefined()
	expect(container.textContent).toBe('Hello world.')
})

test('Greeting enthusiastic', async () => {
	const { container } = await render(<Greeting enthusiasm={10} />)
	expect(container).toBeDefined()
	expect(container.textContent).toBe('Hello world!')
})
