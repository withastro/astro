import path from 'node:path';
import type ts from 'typescript';

const decoratedHosts = new WeakSet<ts.LanguageServiceHost>();
const decoratedProjects = new WeakSet<ts.LanguageServiceHost>();

export function findAstroPackageDirectory(
	tsModule: typeof import('typescript'),
	currentDirectory: string | string[],
): string | undefined {
	for (const candidate of Array.isArray(currentDirectory) ? currentDirectory : [currentDirectory]) {
		const astroDirectory = findAstroPackageDirectoryFrom(tsModule, candidate);
		if (astroDirectory) {
			return astroDirectory;
		}
	}
}

function findAstroPackageDirectoryFrom(
	tsModule: typeof import('typescript'),
	currentDirectory: string,
): string | undefined {
	let directory = tsModule.sys.resolvePath(currentDirectory);

	while (true) {
		const packageJson = path.join(directory, 'node_modules', 'astro', 'package.json');
		if (tsModule.sys.fileExists(packageJson)) {
			return path.dirname(packageJson);
		}

		const parent = path.dirname(directory);
		if (parent === directory) {
			return undefined;
		}
		directory = parent;
	}
}

export function addAstroTypes(
	tsModule: typeof import('typescript'),
	host: ts.LanguageServiceHost,
	currentDirectory: string | string[],
) {
	if (decoratedHosts.has(host)) {
		return;
	}

	const astroDirectory = findAstroPackageDirectory(tsModule, currentDirectory);
	if (!astroDirectory) {
		return;
	}

	const addedFileNames = ['./env.d.ts', './astro-jsx.d.ts']
		.map((filePath) => tsModule.sys.resolvePath(path.resolve(astroDirectory, filePath)))
		.filter((fileName) => tsModule.sys.fileExists(fileName));

	if (!addedFileNames.length) {
		return;
	}

	decoratedHosts.add(host);

	const getScriptFileNames = host.getScriptFileNames.bind(host);
	host.getScriptFileNames = () => {
		const fileNames = getScriptFileNames();
		const seen = new Set(fileNames);

		return [...fileNames, ...addedFileNames.filter((fileName) => !seen.has(fileName))];
	};
}

export function addAstroProjectFiles(
	tsModule: typeof import('typescript'),
	project: ts.server.Project,
	host: ts.LanguageServiceHost,
) {
	if (
		decoratedProjects.has(host) ||
		project.projectKind !== tsModule.server.ProjectKind.Configured
	) {
		return;
	}
	decoratedProjects.add(host);

	const getScriptFileNames = host.getScriptFileNames.bind(host);
	let lastProjectVersion: string | undefined;
	let astroFiles: string[] = [];

	host.getScriptFileNames = () => {
		const fileNames = getScriptFileNames();
		const projectVersion = host.getProjectVersion?.();
		if (!astroFiles.length || projectVersion !== lastProjectVersion) {
			lastProjectVersion = projectVersion;
			astroFiles = findAstroFiles(tsModule, project);
		}

		const seen = new Set(fileNames);
		return [...fileNames, ...astroFiles.filter((fileName) => !seen.has(fileName))];
	};
}

function findAstroFiles(
	tsModule: typeof import('typescript'),
	project: ts.server.Project,
): string[] {
	const configFile = project.getProjectName();
	const config = tsModule.readJsonConfigFile(configFile, project.readFile.bind(project));
	const parseHost = {
		useCaseSensitiveFileNames: project.useCaseSensitiveFileNames(),
		fileExists: project.fileExists.bind(project),
		readFile: project.readFile.bind(project),
		readDirectory: (...args: Parameters<ts.server.Project['readDirectory']>) => {
			args[1] = ['.astro'];
			return project.readDirectory(...args);
		},
	};
	const parsed = tsModule.parseJsonSourceFileConfigFileContent(
		config,
		parseHost,
		project.getCurrentDirectory(),
		undefined,
		configFile,
	);

	return parsed.fileNames;
}
