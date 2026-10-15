import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export interface EvalCase {
	id: number;
	prompt: string;
	expectedOutput: string;
	files: string[];
	assertions: string[];
	skillName: string;
	skillDirectory: string;
	manifestPath: string;
}

export interface SkillDefinitionData {
	name: string;
	description: string;
	instructions: string;
	compatibility?: string;
	files: Record<string, Uint8Array>;
}

export const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const skillsDirectory = join(repositoryRoot, '.agents', 'skills');

export function loadEvalCases(): EvalCase[] {
	const skillDirectories = readdirSync(skillsDirectory, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => join(skillsDirectory, entry.name))
		.filter((directory) => existsSync(join(directory, 'SKILL.md')))
		.sort();

	return skillDirectories.flatMap((skillDirectory) => {
		const skillName = skillDirectory.split(sep).at(-1)!;
		const manifestPath = join(skillDirectory, 'evals', 'evals.json');
		if (!existsSync(manifestPath)) {
			throw new Error(`Missing eval manifest for ${skillName}: ${manifestPath}`);
		}

		const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
		if (!isRecord(manifest)) throw new Error(`Invalid eval manifest: ${manifestPath}`);
		if (manifest.skill_name !== skillName) {
			throw new Error(`${manifestPath} must use skill_name ${JSON.stringify(skillName)}`);
		}
		if (!Array.isArray(manifest.evals) || manifest.evals.length !== 3) {
			throw new Error(`${manifestPath} must contain exactly three evals`);
		}

		const ids = new Set<number>();
		return manifest.evals.map((candidate, index) => {
			if (!isRecord(candidate)) {
				throw new Error(`${manifestPath} eval ${index + 1} must be an object`);
			}
			const id = candidate.id;
			if (!Number.isInteger(id) || (id as number) < 1 || ids.has(id as number)) {
				throw new Error(`${manifestPath} eval IDs must be unique positive integers`);
			}
			ids.add(id as number);

			const files = readStringArray(candidate.files, 'files', manifestPath, index);
			for (const file of files) validateInputPath(file, manifestPath);

			return {
				id: id as number,
				prompt: readString(candidate.prompt, 'prompt', manifestPath, index),
				expectedOutput: readString(
					candidate.expected_output,
					'expected_output',
					manifestPath,
					index,
				),
				files,
				assertions: readStringArray(candidate.assertions, 'assertions', manifestPath, index, true),
				skillName,
				skillDirectory,
				manifestPath,
			};
		});
	});
}

export function loadSkillDefinitions(): SkillDefinitionData[] {
	const skillDirectories = readdirSync(skillsDirectory, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => join(skillsDirectory, entry.name))
		.filter((directory) => existsSync(join(directory, 'SKILL.md')))
		.sort();

	return skillDirectories.map((skillDirectory) => {
		const skillSource = readFileSync(join(skillDirectory, 'SKILL.md'), 'utf8');
		const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(skillSource);
		if (!match) throw new Error(`Invalid SKILL.md frontmatter: ${skillDirectory}`);

		const frontmatter = match[1];
		const name = readFrontmatterField(frontmatter, 'name', skillDirectory);
		const expectedName = skillDirectory.split(sep).at(-1)!;
		if (name !== expectedName) {
			throw new Error(`${skillDirectory}/SKILL.md must use name ${JSON.stringify(expectedName)}`);
		}

		const definition: SkillDefinitionData = {
			name,
			description: readFrontmatterField(frontmatter, 'description', skillDirectory),
			instructions: match[2].trim(),
			files: readSupportingFiles(skillDirectory),
		};
		const compatibility = readOptionalFrontmatterField(frontmatter, 'compatibility');
		if (compatibility) definition.compatibility = compatibility;
		return definition;
	});
}

function readSupportingFiles(skillDirectory: string): Record<string, Uint8Array> {
	const files: Record<string, Uint8Array> = {};
	const visit = (directory: string) => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const absolutePath = join(directory, entry.name);
			const relativePath = relative(skillDirectory, absolutePath).split(sep).join('/');
			if (
				relativePath === 'SKILL.md' ||
				relativePath === 'evals' ||
				relativePath.startsWith('evals/')
			) {
				continue;
			}
			if (entry.isSymbolicLink() || lstatSync(absolutePath).isSymbolicLink()) {
				throw new Error(`Skill resources cannot be symbolic links: ${absolutePath}`);
			}
			if (entry.isDirectory()) visit(absolutePath);
			else if (entry.isFile()) files[relativePath] = readFileSync(absolutePath);
		}
	};
	visit(skillDirectory);
	return files;
}

function readFrontmatterField(frontmatter: string, field: string, source: string): string {
	const value = readOptionalFrontmatterField(frontmatter, field);
	if (!value) throw new Error(`${source}/SKILL.md is missing ${field}`);
	return value;
}

function readOptionalFrontmatterField(frontmatter: string, field: string): string | undefined {
	const match = new RegExp(`^${field}:\\s*(.+)$`, 'm').exec(frontmatter);
	if (!match) return undefined;
	const value = match[1].trim();
	if (value.startsWith("'") && value.endsWith("'")) {
		return value.slice(1, -1).replaceAll("''", "'");
	}
	if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value) as string;
	return value;
}

function readString(value: unknown, field: string, source: string, index: number): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${source} eval ${index + 1} must have a non-empty ${field}`);
	}
	return value;
}

function readStringArray(
	value: unknown,
	field: string,
	source: string,
	index: number,
	requireValue = false,
): string[] {
	if (!Array.isArray(value) || (requireValue && value.length === 0)) {
		throw new Error(
			`${source} eval ${index + 1} must have a${requireValue ? ' non-empty' : 'n'} ${field} array`,
		);
	}
	if (value.some((item) => typeof item !== 'string' || item.trim() === '')) {
		throw new Error(`${source} eval ${index + 1} ${field} must contain non-empty strings`);
	}
	return value as string[];
}

function validateInputPath(file: string, source: string): void {
	if (isAbsolute(file) || file.split(/[\\/]/).includes('..')) {
		throw new Error(`${source} contains an unsafe input path: ${file}`);
	}
	const absolutePath = resolve(repositoryRoot, file);
	if (!absolutePath.startsWith(repositoryRoot + sep) || !existsSync(absolutePath)) {
		throw new Error(`${source} input does not exist inside the repository: ${file}`);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
