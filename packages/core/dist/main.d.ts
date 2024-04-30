import * as react from 'react';
export { P as ParetoPage, a as ParetoRuntimeConfig } from './types-C5iFBvfz.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
export { Helmet, HelmetProvider } from 'react-helmet-async';
import 'express';

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

declare const mockClientPromise: (key: string) => void;

declare function Scripts(): react_jsx_runtime.JSX.Element;

declare const promiseMap: Map<string, Promise<any>>;

type ImageProps = {
    preload?: boolean;
    src: string;
} & React.ImgHTMLAttributes<HTMLImageElement>;
declare const Image: (props: ImageProps) => react_jsx_runtime.JSX.Element;
declare const BackgroundImage: (props: ImageProps) => react_jsx_runtime.JSX.Element;

export { BackgroundImage, type ISOStyle, Image, type ImageProps, type InsertCss, Scripts, StyleContext, mockClientPromise, promiseMap, useStyles };
