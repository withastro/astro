import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { load as cheerioLoad } from "cheerio";
import { isWindows, loadFixture } from "../../../astro/test/test-utils.js";

let fixture;

describe("React Components", () => {
	before(async () => {
		fixture = await loadFixture({
			root: new URL("./fixtures/svelte-component/", import.meta.url),
		});
	});

	describe("build", () => {
		before(async () => {
			await fixture.build();
		});

		it("Should hyrade a Svelte component", async () => {
			const html = await fixture.readFile("/index.html");
			const $ = cheerioLoad(html);

			// test 1: basic component renders
			assert.equal($("#my-heading").text(), "Hello from Svelte!");
		});
	});
});
