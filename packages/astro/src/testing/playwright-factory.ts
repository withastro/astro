import {type AstroConfig} from "../@types/astro";
import { test as testBase } from "@playwright/test";
import { type Fixture, loadFixture } from "./utils.js";

export interface AstroFixture {
	astro: Fixture;
}

export default function playwrightTestFactory(fixtureConfig: Partial<AstroConfig>, preserveFixture = false) {
	let fixture: Fixture;

	const test = testBase.extend<AstroFixture>({
		astro: async ({}, use) => {
			fixture = preserveFixture && fixture ? fixture : (await loadFixture(fixtureConfig));
			await use(fixture);
		},
	});

	test.afterEach(() => {
		fixture.resetAllFiles();
	});

	return test;
}
