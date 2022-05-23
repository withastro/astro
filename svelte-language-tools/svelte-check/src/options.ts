import * as path from 'path';
import sade from 'sade';
import { URI } from 'vscode-uri';

export interface SvelteCheckCliOptions {
    workspaceUri: URI;
    outputFormat: OutputFormat;
    watch: boolean;
    tsconfig?: string;
    filePathsToIgnore: string[];
    failOnWarnings: boolean;
    failOnHints: boolean;
    compilerWarnings: Record<string, 'error' | 'ignore'>;
    diagnosticSources: DiagnosticSource[];
    threshold: Threshold;
    useNewTransformation: boolean;
}

// eslint-disable max-len
export function parseOptions(cb: (opts: SvelteCheckCliOptions) => any) {
    const prog = sade('svelte-check', true)
        .version('2.x')
        .option(
            '--workspace',
            'Path to your workspace. All subdirectories except node_modules and those listed in `--ignore` are checked'
        )
        .option(
            '--output',
            'What output format to use. Options are human, human-verbose, machine.',
            'human-verbose'
        )
        .option(
            '--watch',
            'Will not exit after one pass but keep watching files for changes and rerun diagnostics',
            false
        )
        .option(
            '--tsconfig',
            'Pass a path to a tsconfig or jsconfig file. The path can be relative to the workspace path or absolute. Doing this means that only files matched by the files/include/exclude pattern of the config file are diagnosed. It also means that errors from TypeScript and JavaScript files are reported.'
        )
        .option(
            '--ignore',
            'Files/folders to ignore - relative to workspace root, comma-separated, inside quotes. Example: `--ignore "dist,build"`'
        )
        .option(
            '--fail-on-warnings',
            'Will also exit with error code when there are warnings',
            false
        )
        .option('--fail-on-hints', 'Will also exit with error code when there are hints', false)
        .option(
            '--compiler-warnings',
            'A list of Svelte compiler warning codes. Each entry defines whether that warning should be ignored or treated as an error. Warnings are comma-separated, between warning code and error level is a colon; all inside quotes. Example: `--compiler-warnings "css-unused-selector:ignore,unused-export-let:error"`'
        )
        .option(
            '--diagnostic-sources',
            'A list of diagnostic sources which should run diagnostics on your code. Possible values are `js` (includes TS), `svelte`, `css`. Comma-separated, inside quotes. By default all are active. Example: `--diagnostic-sources "js,svelte"`'
        )
        .option(
            '--threshold',
            'Filters the diagnostics to display. `error` will output only errors while `warning` will output warnings and errors.',
            'hint'
        )
        .option(
            '--use-new-transformation',
            'Svelte files need to be transformed to something that TypeScript understands for intellisense. Version 2.0 of this transformation can be enabled with this setting. It will be the default, soon.',
            false
        )
        .action((opts) => {
            const workspaceUri = getWorkspaceUri(opts);
            cb({
                workspaceUri,
                outputFormat: getOutputFormat(opts),
                watch: !!opts.watch,
                tsconfig: getTsconfig(opts, workspaceUri.fsPath),
                filePathsToIgnore: getFilepathsToIgnore(opts),
                failOnWarnings: !!opts['fail-on-warnings'],
                failOnHints: !!opts['fail-on-hints'],
                compilerWarnings: getCompilerWarnings(opts),
                diagnosticSources: getDiagnosticSources(opts),
                threshold: getThreshold(opts),
                useNewTransformation:
                    opts['use-new-transformation'] && opts['use-new-transformation'] !== 'false'
            });
        });

    prog.parse(process.argv);
}
// eslint-enable max-len

const outputFormats = ['human', 'human-verbose', 'machine'] as const;
type OutputFormat = typeof outputFormats[number];

function getOutputFormat(opts: Record<string, any>): OutputFormat {
    return outputFormats.includes(opts.output) ? opts.output : 'human-verbose';
}

function getWorkspaceUri(opts: Record<string, any>) {
    let workspaceUri;
    let workspacePath = opts.workspace;
    if (workspacePath) {
        if (!path.isAbsolute(workspacePath)) {
            workspacePath = path.resolve(process.cwd(), workspacePath);
        }
        workspaceUri = URI.file(workspacePath);
    } else {
        workspaceUri = URI.file(process.cwd());
    }
    return workspaceUri;
}

function getTsconfig(myArgs: Record<string, any>, workspacePath: string) {
    let tsconfig: string | undefined = myArgs.tsconfig;
    if (tsconfig && !path.isAbsolute(tsconfig)) {
        tsconfig = path.join(workspacePath, tsconfig);
    }
    return tsconfig;
}

function getCompilerWarnings(opts: Record<string, any>) {
    return stringToObj(opts['compiler-warnings']);

    function stringToObj(str = '') {
        return str
            .split(',')
            .map((s) => s.trim())
            .filter((s) => !!s)
            .reduce((settings, setting) => {
                const [name, val] = setting.split(':');
                if (val === 'error' || val === 'ignore') {
                    settings[name] = val;
                }
                return settings;
            }, <Record<string, 'error' | 'ignore'>>{});
    }
}

const diagnosticSources = ['js', 'css', 'svelte'] as const;
type DiagnosticSource = typeof diagnosticSources[number];

function getDiagnosticSources(opts: Record<string, any>): DiagnosticSource[] {
    const sources = opts['diagnostic-sources'];
    return sources
        ? sources
              .split(',')
              ?.map((s: string) => s.trim())
              .filter((s: any) => diagnosticSources.includes(s))
        : diagnosticSources;
}

function getFilepathsToIgnore(opts: Record<string, any>): string[] {
    return opts.ignore?.split(',') || [];
}

const thresholds = ['hint', 'warning', 'error'] as const;
type Threshold = typeof thresholds[number];

function getThreshold(opts: Record<string, any>): Threshold {
    return thresholds.includes(opts.threshold) ? opts.threshold : 'hint';
}
