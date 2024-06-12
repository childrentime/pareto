import { Request, Response } from "express";
import { pageEntries } from "../configs/entry";
import { getRuntimeConfig } from "../configs/runtime.config";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { Scripts } from "../stream-helpers";
import superjson from "superjson";
import { ParetoPage } from "../types";
import { Transform } from "stream";
import { ISOStyle, StyleContext } from "../useStyles";
import { HelmetProvider } from "react-helmet-async";
import { IS_REACT_19 } from "../utils/env";
import { enableSpa } from "../configs/page.config";
import { PageStart, FirstPaint } from "@paretojs/monitor";

// magically speed up ios rendering
const PADDING_EL = '<div style="height: 0">' + "\u200b".repeat(300) + "</div>";
const HEAD_CLOSE_HTML = `</head><body>${PADDING_EL}`;
const BODY_START_HTML = `<div id="main">`;

export interface ParetoRequestHandler {
  delay?: number;
  pageWrapper?: (
    page: ParetoPage | (() => null),
    data: Record<string, any> | undefined
  ) => ParetoPage;
}

export const criticalPageWrapper = (props: {
  page: ParetoPage | (() => null);
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
  const StyleProvider = IS_REACT_19 ? StyleContext : StyleContext.Provider;

  return {
    page: (props) => (
      // @ts-ignore react19
      <StyleProvider value={{ insertCss }}>
        <Page {...props} />
      </StyleProvider>
    ),
    criticalCssMap,
  };
};

export const helmetPageWrapper = (props: {
  page: ParetoPage | (() => null);
}): {
  page: ParetoPage;
  helmetContext: any;
} => {
  const helmetContext = {} as any;
  const { page: Page } = props;
  return {
    page: (props) => (
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
    const isCsr = !!__csr && enableSpa;
    const path = req.path.slice(1);

    if (!pageEntries[path]) {
      res.statusCode = 404;
      res.end("404");
      return;
    }

    const { pages, assets } = getRuntimeConfig();
    const Page = isCsr ? () => null : pages[path];
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

    const pageAssets = !isCsr ? (Page as ParetoPage).getAssets?.() || [] : [];

    const renderHeader = (metas?: JSX.Element[]) => {
      console.log('start', PageStart)
      return renderToStaticMarkup(
        <>
          <PageStart />
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {metas?.map((meta) => meta)}
          {loadedCSS.map((css) => css)}
          {preloadJS.map((js) => js)}
          {pageAssets.map((asset) => (
            <link rel="preload" href={asset.url} as={asset.type} />
          ))}
        </>
      );
    };

    const renderFirstPaint = () => {
      return renderToStaticMarkup(<FirstPaint />);
    };

    const renderMonitorInfos = () => {
      return renderToStaticMarkup(
        <script
          id="MONITOR"
          dangerouslySetInnerHTML={{ __html: res.locals.monitorInfos }}
        />
      );
    };

    // send head before request backend
    res.set({
      "X-Accel-Buffering": "no",
      "Content-Type": "text/html; charset=UTF-8",
    });
    res.write(`<!DOCTYPE html><html lang="zh-Hans"><head>${renderHeader()}`);
    req.monitor.mark("renderTopChunk");
    res.flushHeaders();

    const initialData = !isCsr
      ? await (Page as ParetoPage).getServerSideProps?.(req, res)
      : {};

    req.monitor.mark("loadFirstScreenData");
    const wrapperPage = props.pageWrapper
      ? props.pageWrapper(Page, initialData)
      : Page;
    const { page: helmetPage, helmetContext } = helmetPageWrapper({
      page: wrapperPage,
    });
    const { page: CriticalPage, criticalCssMap } = criticalPageWrapper({
      page: helmetPage,
    });

    const { pipe, abort } = renderToPipeableStream(
      <>
        <CriticalPage initialData={initialData || {}} />
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
          req.monitor.mark("onShellReady");
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

          res.write(
            `${helmetContent}${styles}${HEAD_CLOSE_HTML}${renderFirstPaint()}${BODY_START_HTML}`
          );

          let transform = new Transform({
            transform(chunk, encoding, callback) {
              this.push(chunk);
              callback();
            },
            flush(callback) {
              req.monitor.mark("pipeEnd");
              this.push(`${renderMonitorInfos()}</body></html>`);
              callback();
            },
          });
          pipe(transform).pipe(res);
        },
        onAllReady() {
          req.monitor.mark("onAllReady");
        },
      }
    );
    setTimeout(() => {
      abort();
    }, props?.delay || 10000);
  };
