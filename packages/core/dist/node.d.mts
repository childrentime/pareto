import { a as ParetoRuntimeConfig, P as ParetoPage } from './types-CXhhAA3U.mjs';
import { Request, Response } from 'express';

/**
 * @type {record<string,string>}
 */
declare const pageEntries: record<string, string>;

declare const getRuntimeConfig: () => ParetoRuntimeConfig;
declare const setRuntimeConfig: (value: ParetoRuntimeConfig) => void;

interface ParetoRequestHandler {
    delay?: number;
    pageWrapper?: (page: ParetoPage, data: Record<string, any> | undefined) => {
        page: ParetoPage;
        criticalCssMap?: Map<string, string>;
        helmetContext?: {
            helmet?: any;
        };
    };
}
declare const paretoRequestHandler: (props?: ParetoRequestHandler) => (req: Request, res: Response) => Promise<void>;

export { type ParetoRequestHandler, getRuntimeConfig, pageEntries, paretoRequestHandler, setRuntimeConfig };
