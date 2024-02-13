import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import { getLanguageModule } from './language.js';

export = createLanguageServicePlugin(() => [getLanguageModule()]);
