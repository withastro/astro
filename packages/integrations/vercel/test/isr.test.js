import { loadFixture } from "./test-utils.js";
import { expect } from "chai";

describe("ISR", () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: "./fixtures/isr/",
		});
		await fixture.build();
	});

	it("generates expected prerender config", async () => {
		const vcConfig = JSON.parse(
			await fixture.readFile("../.vercel/output/functions/_isr.prerender-config.json")
		);
		expect(vcConfig).to.deep.include({
			"expiration": 120,
			"bypassToken": "1c9e601d-9943-4e7c-9575-005556d774a8",
			"allowQuery": ["x_astro_path"],
			"passQuery": true
		})
	})
})
