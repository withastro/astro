import { SqliteBackendBase } from "./sqliteBase.js";

export class LibsqlBackend extends SqliteBackendBase {
	executeOps(ops: string[]): Promise<void> {
		throw new Error("Method not implemented.");
	}
	getDbExportModule(target: "local" | "remote"): string {
		throw new Error("Method not implemented.");
	}
	getTypeDeclarations(): string {
		throw new Error("Method not implemented.");
	}
}
