import { a as ParetoRuntimeConfig } from './types-C5iFBvfz.js';
import 'express';

/**
 * @type {record<string,string>}
 */
declare const pageEntries: record<string, string>;

declare const getRuntimeConfig: () => ParetoRuntimeConfig;
declare const setRuntimeConfig: (value: ParetoRuntimeConfig) => void;

export { getRuntimeConfig, pageEntries, setRuntimeConfig };
