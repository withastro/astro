import { watch, FSWatcher } from 'chokidar';
import { readFile } from 'fs';
import { isNotNullOrUndefined, flatten } from '../../utils';

const varRegex = /^\s*(--\w+.*?):\s*?([^;]*)/;

export interface GlobalVar {
    name: string;
    filename: string;
    value: string;
}

export class GlobalVars {
    private fsWatcher?: FSWatcher;
    private globalVars = new Map<string, GlobalVar[]>();

    watchFiles(filesToWatch: string): void {
        if (!filesToWatch) {
            return;
        }

        if (this.fsWatcher) {
            this.fsWatcher.close();
            this.globalVars.clear();
        }

        this.fsWatcher = watch(filesToWatch.split(','))
            .addListener('add', (file) => this.updateForFile(file))
            .addListener('change', (file) => {
                this.updateForFile(file);
            })
            .addListener('unlink', (file) => this.globalVars.delete(file));
    }

    private updateForFile(filename: string) {
        // Inside a small timeout because it seems chikidar is "too fast"
        // and reading the file will then return empty content
        setTimeout(() => {
            readFile(filename, 'utf-8', (error, contents) => {
                if (error) {
                    return;
                }

                const globalVarsForFile = contents
                    .split('\n')
                    .map((line) => line.match(varRegex))
                    .filter(isNotNullOrUndefined)
                    .map((line) => ({ filename, name: line[1], value: line[2] }));
                this.globalVars.set(filename, globalVarsForFile);
            });
        }, 1000);
    }

    getGlobalVars(): GlobalVar[] {
        return flatten([...this.globalVars.values()]);
    }
}
