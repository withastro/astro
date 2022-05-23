import { EventEmitter } from 'events';

const configurationEventName = 'configuration-changed';

export interface Configuration {
    enable: boolean;
}

export class ConfigManager {
    private emitter = new EventEmitter();
    private config: Configuration = {
        enable: true
    };

    onConfigurationChanged(listener: (config: Configuration) => void) {
        this.emitter.on(configurationEventName, listener);
    }

    updateConfigFromPluginConfig(config: Configuration) {
        this.config = {
            ...this.config,
            ...config
        };
        this.emitter.emit(configurationEventName, config);
    }

    getConfig() {
        return this.config;
    }
}
