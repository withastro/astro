import { defineStore } from './registry';

export const store = defineStore('test', 'initial value');
export const testValue = store.value;
