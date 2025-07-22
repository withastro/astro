import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";
import { getRemoteDatabaseInfo } from "../../dist/core/utils.js";
import { clearEnvironment } from "../test-utils.js";

describe("RemoteDatabaseInfo", () => {
	beforeEach(() => {
		clearEnvironment();
	});

	// TODO: what should be the default url for libsql?
	test("default remote info", () => {
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			type: "studio",
			url: "https://db.services.astro.build",
		});
	});

	test("configured libSQL remote", () => {
		process.env.ASTRO_DB_REMOTE_URL = "libsql://libsql.self.hosted";
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			type: "libsql",
			url: "libsql://libsql.self.hosted",
		});
	});
});
