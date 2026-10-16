import MagicString, { type SourceMap } from 'magic-string';
import type { ESTree } from 'vite';
import { LIVE_CONTENT_TYPE } from './consts.js';

type Location = { line: number; column: number };

export type LiveCollectionsModule =
	| {
			type: 'sliced';
			code: string;
			map: SourceMap;
			/** Top-level statements that are removed even though they may have side effects. */
			droppedStatements: Location[];
	  }
	| {
			/** The content config can't be sliced, so the whole module must be used. */
			type: 'unsupported';
			reason: string;
			location?: Location;
	  };

/**
 * Rewrites the source of a content config module so that it only contains its live collections
 * and the top-level code they reference. The result is bundled into the server, so build-time
 * loaders and their dependencies stay out of it.
 *
 * A collection is live when it's defined in `collections` as `defineCollection({ type: 'live', ... })`,
 * either inline or through a top-level `const`.
 *
 * @param code The JavaScript source of the content config.
 * @param ast The ESTree AST of `code`.
 * @param liveNames The names of the live collections found by evaluating the content config, if known.
 *   They are used to detect live collections that can't be found statically.
 */
export function sliceLiveCollections(
	code: string,
	ast: ESTree.Program,
	liveNames?: Set<string>,
): LiveCollectionsModule {
	const statements = ast.body;
	const collectionsStatement = statements.find(isCollectionsExport);
	if (!collectionsStatement) {
		return {
			type: 'unsupported',
			reason: '`collections` must be exported as `export const collections = { ... }`',
		};
	}
	const declarator = (collectionsStatement.declaration as ESTree.VariableDeclaration)
		.declarations[0];
	const object = declarator.init;
	if (object?.type !== 'ObjectExpression') {
		return {
			type: 'unsupported',
			reason: '`collections` must be an object literal',
			location: getLocation(code, declarator.start),
		};
	}

	const topLevelInits = new Map<string, ESTree.Expression>();
	for (const statement of statements) {
		const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
		if (declaration?.type !== 'VariableDeclaration' || declaration.kind !== 'const') continue;
		for (const { id, init } of declaration.declarations) {
			if (id.type === 'Identifier' && init) topLevelInits.set(id.name, init);
		}
	}

	const keptProperties: ESTree.Node[] = [];
	const keptNames = new Set<string>();
	for (const property of object.properties) {
		if (property.type !== 'Property' || property.computed) continue;
		const name = getPropertyName(property.key);
		if (name === undefined) continue;
		const value =
			property.value.type === 'Identifier'
				? topLevelInits.get(property.value.name)
				: property.value;
		const kind = classifyCollection(value);
		if (kind === 'unknown' && liveNames?.has(name)) {
			return {
				type: 'unsupported',
				reason: `the live collection "${name}" must be defined with \`defineCollection({ type: 'live', ... })\``,
				location: getLocation(code, property.start),
			};
		}
		if (kind === 'live') {
			keptProperties.push(property);
			keptNames.add(name);
		}
	}
	for (const name of liveNames ?? []) {
		if (!keptNames.has(name)) {
			return {
				type: 'unsupported',
				reason: `the live collection "${name}" must be an explicit property of \`collections\``,
				location: getLocation(code, object.start),
			};
		}
	}

	const s = new MagicString(code);
	s.overwrite(
		object.start,
		object.end,
		`{ ${keptProperties.map((p) => code.slice(p.start, p.end)).join(', ')} }`,
	);

	// Keep every top-level statement reachable from the kept collections. Statements that
	// reference a kept binding are kept too, because they may mutate it.
	const needed = new Set<string>();
	for (const property of keptProperties) collectReferences(property, needed);
	const kept = new Set<ESTree.Node>([collectionsStatement]);
	let changed = true;
	while (changed) {
		changed = false;
		for (const statement of statements) {
			if (kept.has(statement) || statement.type === 'ImportDeclaration') continue;
			const declared = getDeclaredNames(statement);
			const isNeeded = declared
				? declared.some((name) => needed.has(name))
				: !isExport(statement) && hasAnyReference(statement, needed);
			if (isNeeded) {
				kept.add(statement);
				collectReferences(statement, needed);
				changed = true;
			}
		}
	}

	const droppedStatements: Location[] = [];
	for (const statement of statements) {
		if (statement.type === 'ImportDeclaration') {
			// Imports without specifiers are only imported for their side effects.
			if (statement.specifiers.length === 0) continue;
			const specifiers = statement.specifiers.filter((s) => needed.has(s.local.name));
			if (specifiers.length === 0) {
				s.remove(statement.start, statement.end);
			} else if (specifiers.length < statement.specifiers.length) {
				s.overwrite(statement.start, statement.end, printImport(statement, specifiers));
			}
			continue;
		}
		if (kept.has(statement)) continue;
		if (!getDeclaredNames(statement) && !isExport(statement)) {
			droppedStatements.push(getLocation(code, statement.start));
		}
		s.remove(statement.start, statement.end);
	}

	return {
		type: 'sliced',
		code: s.toString(),
		map: s.generateMap({ hires: 'boundary' }),
		droppedStatements,
	};
}

function isCollectionsExport(
	statement: ESTree.Node,
): statement is ESTree.ExportNamedDeclaration {
	return (
		statement.type === 'ExportNamedDeclaration' &&
		statement.declaration?.type === 'VariableDeclaration' &&
		statement.declaration.declarations.length === 1 &&
		statement.declaration.declarations[0].id.type === 'Identifier' &&
		statement.declaration.declarations[0].id.name === 'collections'
	);
}

function classifyCollection(value: ESTree.Node | undefined | null): 'live' | 'build' | 'unknown' {
	if (
		value?.type !== 'CallExpression' ||
		value.callee.type !== 'Identifier' ||
		value.callee.name !== 'defineCollection'
	) {
		return 'unknown';
	}
	const config = value.arguments[0];
	if (config?.type !== 'ObjectExpression') return 'unknown';
	for (const property of config.properties) {
		if (property.type === 'SpreadElement') return 'unknown';
		if (!property.computed && getPropertyName(property.key) === 'type') {
			if (property.value.type !== 'Literal') return 'unknown';
			return property.value.value === LIVE_CONTENT_TYPE ? 'live' : 'build';
		}
	}
	return 'build';
}

function getPropertyName(key: ESTree.Node): string | undefined {
	if (key.type === 'Identifier') return key.name;
	if (key.type === 'Literal' && typeof key.value === 'string') return key.value;
	return undefined;
}

function isExport(statement: ESTree.Node): boolean {
	return (
		statement.type === 'ExportNamedDeclaration' ||
		statement.type === 'ExportDefaultDeclaration' ||
		statement.type === 'ExportAllDeclaration'
	);
}

/** Returns the names declared by a top-level statement, or `undefined` if it doesn't declare any. */
function getDeclaredNames(statement: ESTree.Node): string[] | undefined {
	const declaration =
		statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
			? statement.declaration
			: statement;
	if (!declaration) return undefined;
	if (declaration.type === 'VariableDeclaration') {
		const names: string[] = [];
		for (const declarator of declaration.declarations) collectPatternNames(declarator.id, names);
		return names;
	}
	if (
		(declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') &&
		declaration.id
	) {
		return [declaration.id.name];
	}
	return undefined;
}

function collectPatternNames(pattern: ESTree.Node, names: string[]) {
	switch (pattern.type) {
		case 'Identifier':
			names.push(pattern.name);
			break;
		case 'ObjectPattern':
			for (const property of pattern.properties) {
				collectPatternNames(property.type === 'RestElement' ? property : property.value, names);
			}
			break;
		case 'ArrayPattern':
			for (const element of pattern.elements) if (element) collectPatternNames(element, names);
			break;
		case 'RestElement':
			collectPatternNames(pattern.argument, names);
			break;
		case 'AssignmentPattern':
			collectPatternNames(pattern.left, names);
			break;
	}
}

/**
 * Collects the names of all identifiers in `node`. Shadowed names are collected too, which can
 * only keep more code than needed.
 */
function collectReferences(node: ESTree.Node, names: Set<string>) {
	walk(node, (identifier) => {
		names.add(identifier);
		return false;
	});
}

function hasAnyReference(node: ESTree.Node, names: Set<string>): boolean {
	return walk(node, (identifier) => names.has(identifier));
}

/** Calls `visit` with each identifier name in `node`, and stops when it returns `true`. */
function walk(node: any, visit: (identifier: string) => boolean): boolean {
	if (Array.isArray(node)) return node.some((child) => walk(child, visit));
	if (!node || typeof node.type !== 'string') return false;
	if (node.type === 'Identifier') return visit(node.name);
	for (const key in node) {
		if (key === 'type' || key === 'start' || key === 'end') continue;
		// Skip names that aren't variable references: `obj.name`, `{ name: value }` and class members.
		if (
			key === 'property' &&
			node.type === 'MemberExpression' &&
			!node.computed
		) {
			continue;
		}
		if (
			key === 'key' &&
			(node.type === 'Property' ||
				node.type === 'MethodDefinition' ||
				node.type === 'PropertyDefinition') &&
			!node.computed &&
			!node.shorthand
		) {
			continue;
		}
		const child = node[key];
		if (child && typeof child === 'object' && walk(child, visit)) return true;
	}
	return false;
}

function printImport(
	statement: ESTree.ImportDeclaration,
	specifiers: ESTree.ImportDeclaration['specifiers'],
): string {
	const parts: string[] = [];
	const named: string[] = [];
	for (const specifier of specifiers) {
		if (specifier.type === 'ImportDefaultSpecifier') {
			parts.push(specifier.local.name);
		} else if (specifier.type === 'ImportNamespaceSpecifier') {
			parts.push(`* as ${specifier.local.name}`);
		} else {
			const imported =
				specifier.imported.type === 'Identifier'
					? specifier.imported.name
					: JSON.stringify(specifier.imported.value);
			named.push(imported === specifier.local.name ? imported : `${imported} as ${specifier.local.name}`);
		}
	}
	if (named.length > 0) parts.push(`{ ${named.join(', ')} }`);
	return `import ${parts.join(', ')} from ${JSON.stringify(statement.source.value)};`;
}

function getLocation(code: string, offset: number): Location {
	const lines = code.slice(0, offset).split('\n');
	return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}
