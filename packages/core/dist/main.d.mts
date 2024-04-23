import * as react from 'react';

interface ISOStyle {
    _getContent: () => any;
    _getCss: () => string;
    _insertCss: (options?: {
        /**
         * @default false
         */
        replace: boolean;
        /**
         * @default false
         */
        prepend: boolean;
        /**
         * @default 's'
         */
        prefix: string;
    }) => () => void;
    _getHash: () => string;
}
type InsertCss = (styles: ISOStyle[]) => (() => void) | void;
declare const StyleContext: react.Context<{
    insertCss: InsertCss | null;
}>;
declare function useStyles(...styles: any[]): void;

export { type ISOStyle, type InsertCss, StyleContext, useStyles };
