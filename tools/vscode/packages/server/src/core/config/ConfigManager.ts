import { VSCodeEmmetConfig } from 'vscode-emmet-helper';

export class ConfigManager {
    private emmetConfig: VSCodeEmmetConfig = {};
    
    updateEmmetConfig(config: VSCodeEmmetConfig): void {
        this.emmetConfig = config || {};
    }

    getEmmetConfig(): VSCodeEmmetConfig {
        return this.emmetConfig;
    }
}
