import type { LanguageServicePlugin } from '@volar/language-service';
import type { Provide } from 'volar-service-yaml';
import type { CollectionConfig } from '../core/frontmatterHolders.js';
type LanguageSettings = Parameters<ReturnType<Provide['yaml/languageService']>['configure']>['0'];
export declare function getSettings(collectionConfig: CollectionConfig): LanguageSettings;
export declare const create: (collectionConfig: CollectionConfig) => LanguageServicePlugin;
export {};
