import { Request, Response } from "express";
import { pageEntries } from "../configs/entry";
import { getRuntimeConfig } from "../configs/runtime.config";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { Scripts } from "../stream-helpers";
import superjson from "superjson";
import { ParetoPage } from "../types";
import { Transform } from "stream";
import { ISOStyle, StyleContext } from "../useStyles";
import { HelmetProvider } from "../head";

// magically speed up ios rendering
const PADDING_EL = '<div style="height: 0">' + "\u200b".repeat(300) + "</div>";
const HEAD_CLOSE_HTML = `</head><body>${PADDING_EL}<div id="main">`;

export interface ParetoRequestHandler {
  delay?: number;
  pageWrapper?: (
    page: ParetoPage,
    data: Record<string, any> | undefined
  ) => {
    page: ParetoPage;
    criticalCssMap?: Map<string, string>;
    helmetContext?: { helmet?: any };
  };
}

export const criticalPageWrapper = (props: {
  page: ParetoPage;
}): {
  page: ParetoPage;
  criticalCssMap: Map<string, string>;
} => {
  const { page: Page } = props;
  const criticalCssMap = new Map<string, string>();
  const insertCss = (styles: ISOStyle[]) =>
    styles.forEach((style) => {
      criticalCssMap.set(style._getHash(), style._getContent());
    });

  return {
    page: (props) => (
      // @ts-ignore react19
      <StyleContext value={{ insertCss }}>
        <Page {...props} />
      </StyleContext>
    ),
    criticalCssMap,
  };
};

export const helmetPageWrapper = (props: {
  page: ParetoPage;
}): {
  page: ParetoPage;
  helmetContext: any;
} => {
  const helmetContext = {} as any;
  const { page: Page } = props;
  return {
    page: (props) => (
      // @ts-ignore react19
      <HelmetProvider context={helmetContext}>
        <Page {...props} />
      </HelmetProvider>
    ),
    helmetContext,
  };
};

export const paretoRequestHandler =
  (props: ParetoRequestHandler = {}) =>
  async (req: Request, res: Response) => {
    const __csr = req.query.__csr;
    const path = req.path.slice(1);
    if (!pageEntries[path]) {
      return;
    }

    const { pages, assets } = getRuntimeConfig();
    const asset = assets[path];
    const { js, css } = asset;
    const jsArr = typeof js === "string" ? [js] : [...(js || [])];
    const cssArr = typeof css === "string" ? [css] : [...(css || [])];

    const preloadJS = jsArr.map((js) => {
      return <link rel="preload" href={js} as="script" key={js} />;
    });
    const loadedCSS = cssArr.map((css) => {
      return <link rel="stylesheet" href={css} type="text/css" key={css} />;
    });
    const loadedJs = jsArr.map((js) => {
      return <script src={js} async key={js} />;
    });

    const renderHeader = (metas?: JSX.Element[]) => {
      return renderToStaticMarkup(
        <>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {metas?.map((meta) => meta)}
          {loadedCSS.map((css) => css)}
          {preloadJS.map((js) => js)}
        </>
      );
    };

    // send head before request backend
    res.set({
      "X-Accel-Buffering": "no",
      "Content-Type": "text/html; charset=UTF-8",
    });
    res.write(`<!DOCTYPE html><html lang="zh-Hans"><head>${renderHeader()}`);
    res.flushHeaders();

    const Page = __csr ? () => null : pages[path];
    const initialData = !__csr
      ? await (Page as ParetoPage).getServerSideProps?.(req, res)
      : {};

    props.pageWrapper =
      props?.pageWrapper ||
      ((Page) => {
        return {
          page: Page,
          criticalCssMap: new Map<string, string>(),
          helmetContext: {},
        };
      });
    const {
      page: WrapperPage,
      helmetContext = {},
      criticalCssMap = new Map<string, string>(),
      // @ts-ignore
    } = props.pageWrapper(Page, initialData);

    const { pipe, abort } = renderToPipeableStream(
      <>
        <WrapperPage initialData={initialData || {}} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__INITIAL_DATA__ = '${superjson.stringify(
              initialData?.getState?.() || initialData
            )}';`,
          }}
        />
        {loadedJs.map((Script) => Script)}
        <Scripts />
      </>,
      {
        onShellReady() {
          // head injection
          const { helmet } = helmetContext;
          const helmetContent = helmet
            ? `
          ${helmet.title.toString()}
          ${helmet.priority.toString()}
          ${helmet.meta.toString()}
          ${helmet.link.toString()}
          ${helmet.script.toString()}
        `
            : "";

          // critical css injection
          const styles = [...criticalCssMap.keys()]
            .map((key) => {
              return `<style id="${key}">${criticalCssMap.get(key)}</style>`;
            })
            .join("\n");

          res.write(`${helmetContent}${styles}${HEAD_CLOSE_HTML}`);

          let transform = new Transform({
            transform(chunk, encoding, callback) {
              this.push(chunk);
              callback();
            },
            flush(callback) {
              this.push("</body></html>");
              callback();
            },
          });
          pipe(transform).pipe(res);
        },
      }
    );
    setTimeout(() => {
      abort();
    }, props?.delay || 10000);
  };
