import { createContext, useContext, useInsertionEffect } from "react";

export interface ISOStyle {
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

export type InsertCss = (styles: ISOStyle[]) => (() => void) | void;

const StyleContext = createContext<{
  insertCss: InsertCss | null;
}>({
  insertCss: null,
});

// @ts-ignore
const isBrowser = (() => this && typeof this.window === "object")();

const __DEV__ = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

function useStyles(...styles: any[]) {
  const { insertCss } = useContext(StyleContext);
  if (!insertCss)
    throw new Error(
      'Please provide "insertCss" function by StyleContext.Provider'
    );
  const runEffect = () => {
    const removeCss = insertCss(styles as unknown as ISOStyle[]);
    return () => {
      removeCss && setTimeout(removeCss, 0);
    };
  };
  if (isBrowser) {
    useInsertionEffect(runEffect, []);
  } else {
    runEffect();
  }
}

export { StyleContext, useStyles };
