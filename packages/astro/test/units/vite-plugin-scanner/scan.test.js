import { expect } from 'chai';
import { scan } from '../../../dist/vite-plugin-scanner/scan.js';

describe('astro scan', () => {
	it('should return empty object', async () => {
		const result = await scan(`export {}`, '/src/components/index.astro');
		expect(Object.keys(result).length).to.equal(0);
	});

	it('recognizes constant boolean literal (false)', async () => {
		const result = await scan(`export const prerender = true;`, '/src/components/index.astro');
		expect(result.prerender).to.equal(true);
	});

	it('recognizes constant boolean literal (false)', async () => {
		const result = await scan(`export const prerender = false;`, '/src/components/index.astro');
		expect(result.prerender).to.equal(false);
	});

	it("recognizes single quoted boolean ('true')", async () => {
		const result = await scan(`export const prerender = 'true';`, '/src/components/index.astro');
		expect(result.prerender).to.equal(true);
	});

	it('recognizes double quoted boolean ("true")', async () => {
		const result = await scan(`export const prerender = "true";`, '/src/components/index.astro');
		expect(result.prerender).to.equal(true);
	});

	it('recognizes double quoted boolean ("false")', async () => {
		const result = await scan(`export const prerender = "false";`, '/src/components/index.astro');
		expect(result.prerender).to.equal(false);
	});

	it("recognizes single quoted boolean ('false')", async () => {
		const result = await scan(`export const prerender = 'false';`, '/src/components/index.astro');
		expect(result.prerender).to.equal(false);
	});

	it('recognizes number (1)', async () => {
		const result = await scan(`export const prerender = 1;`, '/src/components/index.astro');
		expect(result.prerender).to.equal(true);
	});

	it('recognizes number (0)', async () => {
		const result = await scan(`export const prerender = 0;`, '/src/components/index.astro');
		expect(result.prerender).to.equal(false);
	});

	it('throws on let boolean literal', async () => {
		try {
			await scan(`export let prerender = true;`, '/src/components/index.astro');
			expect(false).to.be.true;
		} catch (e) {
			expect(e.message).to.contain(
				`A \`prerender\` export has been detected, but its value cannot be statically analyzed.`
			);
		}
	});

	it('throws on var boolean literal', async () => {
		try {
			await scan(`export var prerender = true;`, '/src/components/index.astro');
			expect(false).to.be.true;
		} catch (e) {
			expect(e.message).to.contain(
				`A \`prerender\` export has been detected, but its value cannot be statically analyzed.`
			);
		}
	});

	it('throws on unknown values I', async () => {
		try {
			await scan(`export const prerender = !!value;`, '/src/components/index.astro');
			expect(false).to.be.true;
		} catch (e) {
			expect(e.message).to.contain(
				`A \`prerender\` export has been detected, but its value cannot be statically analyzed.`
			);
		}
	});

	it('throws on unknown values II', async () => {
		try {
			await scan(`export const prerender = value;`, '/src/components/index.astro');
			expect(false).to.be.true;
		} catch (e) {
			expect(e.message).to.contain(
				`A \`prerender\` export has been detected, but its value cannot be statically analyzed.`
			);
		}
	});

	it('throws on unknown values III', async () => {
		try {
			await scan(
				`export let prerender = undefined; prerender = true;`,
				'/src/components/index.astro'
			);
			expect(false).to.be.true;
		} catch (e) {
			expect(e.message).to.contain(
				`A \`prerender\` export has been detected, but its value cannot be statically analyzed.`
			);
		}
	});

	it('throws on unknown values IV', async () => {
		try {
			await scan(`let prerender = true; export { prerender }`, '/src/components/index.astro');
			expect(false).to.be.true;
		} catch (e) {
			expect(e.message).to.contain(
				`A \`prerender\` export has been detected, but its value cannot be statically analyzed.`
			);
		}
	});
});
