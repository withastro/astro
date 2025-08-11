import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type {
	column as TColumn,
	defineTable as TDefineTable,
} from '../../dist/_internal/runtime/virtual.d.ts';
import { column as _column, defineTable as _defineTable } from '../../dist/runtime/virtual.js';
import { asDrizzleTable } from '../../dist/utils.js';

// Ensure the correct types are being used for tests...
// This is a workaround due to the types being exported under /_internal/ path
// and not under /runtime/ path.
const column: typeof TColumn = _column;
const defineTable: typeof TDefineTable = _defineTable;

describe('Table Type Tests', () => {
	it('basic table', async () => {
		const testTable = defineTable({
			columns: {
				id: column.number({ primaryKey: true }),
				name: column.text(),
				createdAt: column.date(),
			},
		});

		const tsTestTable = asDrizzleTable('testTable', testTable);

		expectTypeOf(tsTestTable.$inferInsert).toEqualTypeOf<{
			name: string;
			createdAt: Date;
			id?: number | undefined;
		}>();

		expectTypeOf(tsTestTable.$inferSelect).toEqualTypeOf<{
			id: number;
			name: string;
			createdAt: Date;
		}>();
	});

	it('table with optional column', async () => {
		const optionalTable = defineTable({
			columns: {
				id: column.number({ primaryKey: true }),
				name: column.text(),
				description: column.text({ optional: true }),
			},
		});

		const tsOptionalTable = asDrizzleTable('optionalTable', optionalTable);

		expectTypeOf(tsOptionalTable.$inferInsert).toEqualTypeOf<{
			name: string;
			id?: number | undefined;
			description?: string | null | undefined;
		}>();

		expectTypeOf(tsOptionalTable.$inferSelect).toEqualTypeOf<{
			id: number;
			name: string;
			description: string | null;
		}>();
	});

	it('table with enum column', async () => {
		const enumTable = defineTable({
			columns: {
				id: column.number({ primaryKey: true }),
				name: column.text(),
				status: column.text({ enum: ['active', 'inactive'] }),
			},
		});

		const tsEnumTable = asDrizzleTable('enumTable', enumTable);

		expectTypeOf(tsEnumTable.$inferInsert).toEqualTypeOf<{
			name: string;
			id?: number | undefined;
			status: 'active' | 'inactive';
		}>();

		expectTypeOf(tsEnumTable.$inferSelect).toEqualTypeOf<{
			id: number;
			name: string;
			status: 'active' | 'inactive';
		}>();
	});

	it('table with optional enum column', async () => {
		const enumTable = defineTable({
			columns: {
				id: column.number({ primaryKey: true }),
				name: column.text(),
				status: column.text({ enum: ['active', 'inactive'], optional: true }),
			},
		});

		const tsEnumTable = asDrizzleTable('enumTable', enumTable);

		expectTypeOf(tsEnumTable.$inferInsert).toEqualTypeOf<{
			name: string;
			id?: number | undefined;
			status?: 'active' | 'inactive' | null | undefined;
		}>();

		expectTypeOf(tsEnumTable.$inferSelect).toEqualTypeOf<{
			id: number;
			name: string;
			status: 'active' | 'inactive' | null;
		}>();
	});
});
