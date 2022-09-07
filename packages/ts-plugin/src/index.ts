import type ts from 'typescript/lib/tsserverlibrary';
import { AstroSnapshotManager } from './astro-snapshots.js';
import { decorateLanguageService } from './language-service/index.js';
import { Logger } from './logger.js';
import { patchModuleLoader } from './module-loader.js';

function init(modules: { typescript: typeof ts }) {
	function create(info: ts.server.PluginCreateInfo) {
		const logger = new Logger(info.project.projectService.logger);

		if (!isAstroProject(info)) {
			logger.log('Detected that this is not an Astro project, abort patching TypeScript');
			return info.languageService;
		}

		logger.log('Starting Astro plugin');

		const snapshotManager = new AstroSnapshotManager(modules.typescript, info.project.projectService, logger);

		patchCompilerOptions(info.project);
		patchModuleLoader(logger, snapshotManager, modules.typescript, info.languageServiceHost, info.project);
		return decorateLanguageService(info.languageService, snapshotManager, logger);
	}

	function getExternalFiles(_project: ts.server.ConfiguredProject) {
		// Needed so the ambient definitions are known inside the tsx files
		/*const astroTsPath = dirname(require.resolve('astro2tsx'));
      const astroTsxFiles = [
          './astro-shims.d.ts',
          './astro-jsx.d.ts',
          './astro-native-jsx.d.ts'
      ].map((f) => modules.typescript.sys.resolvePath(resolve(astroTsPath, f)));
      return astroTsxFiles;*/
		return [];
	}

	function patchCompilerOptions(project: ts.server.Project) {
		const compilerOptions = project.getCompilerOptions();
		// Patch needed because astro2tsx creates jsx/tsx files
		compilerOptions.jsx = modules.typescript.JsxEmit.Preserve;

		// detect which JSX namespace to use (astro | astronative) if not specified or not compatible
		if (!compilerOptions.jsxFactory?.startsWith('astro')) {
			// Default to regular astro, this causes the usage of the "astro.JSX" namespace
			// We don't need to add a switch for astro-native because the jsx is only relevant
			// within Astro files, which this plugin does not deal with.
			compilerOptions.jsxFactory = 'astro.createElement';
		}
	}

	function isAstroProject(info: ts.server.PluginCreateInfo) {
		// Add more checks like "no Astro file found" or "no config file found"?
		const compilerOptions = info.project.getCompilerOptions();
		const isNoJsxProject =
			(!compilerOptions.jsx || compilerOptions.jsx === modules.typescript.JsxEmit.Preserve) &&
			(!compilerOptions.jsxFactory || compilerOptions.jsxFactory.startsWith('astro')) &&
			!compilerOptions.jsxFragmentFactory &&
			!compilerOptions.jsxImportSource;
		return isNoJsxProject;
	}

	return { create, getExternalFiles };
}

export = init;
