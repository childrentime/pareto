# @paretojs/monitor

[中文版](./README-zh.md)

A Visual Performance Panel

## Usage

### Server

#### Setup

```ts
import { addMonitorMiddleware } from "@paretojs/monitor";
import express from "express";

const app = express();

addMonitorMiddleware(app)({
  showMonitor: true,
});
```

#### Mark

```tsx
req.monitor.mark("renderTopChunk");
```

#### Inject to window

```tsx
<script
  id="MONITOR"
  dangerouslySetInnerHTML={{ __html: res.locals.monitorInfos }}
/>
```

### Client

#### Usage

```tsx
import { report, FirstScreen } from "@paretojs/monitor";
import { useEffect } from "react";

const App = () => {
  useEffect(() => {
    report().then(console.log);
  }, []);

  return (
    <>
      <div>app</div>
      <FirstScreen />
    </>
  );
};
```

## Report

`@paretojs/monitor` collects two types of data. One is returned by the `report()` function mentioned above, and the other is collected using the `web-vitals` package. As the data collected by `web-vitals` is recommended to be reported during `visibilitychange` and `pagehide` events (refer to `https://github.com/GoogleChrome/web-vitals/blob/main/README.md#batch-multiple-reports-together`), we store the data collected by `web-vitals` in `window['WEB_VITALS']`.

### Pitfall

The Time to Interactive (TTI) collected by the `web-vitals` package is much longer than what we collect ourselves. This is because it waits for the DOM to stabilize, which conflicts with the characteristics of stream rendering.

### Report Example

```tsx
const App = () => {
  useEffect(() => {
    report().then((data) => {
      // your report function
      sendToAnalytics(data);
    });

    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sendToAnalytics(window["__WEB_VITALS__"]);
      }
    });

    // NOTE: Safari does not reliably fire the `visibilitychange` event when the
    // page is being unloaded. If Safari support is needed, you should also flush
    // the queue in the `pagehide` event.
    addEventListener("pagehide", () => {
      sendToAnalytics(window["__WEB_VITALS__"]);
    });

    return () => {
      // remove listeners....
    };
  }, []);

  return (
    <>
      <div>app</div>
      <FirstScreen />
    </>
  );
};
```

## Metrics Description

### Custom

| Parameter | Explanation                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ps`      | Page Start - The timestamp from the first script in the head tag                                                                             |
| `fp`      | First Paint - The time when the first paint happens on the screen.                                                                           |
| `dr`      | DOM Ready - The time when the DOM (Document Object Model) is ready.                                                                          |
| `ld`      | Load - The time when the full page has loaded.                                                                                               |
| `fsn`     | First Screen No Images - The end time of the first screen render (regardless of whether the images have finished loading)                    |
| `fraf`    | First RequestAnimationFrame - The time when the first RequestAnimationFrame API is called.                                                   |
| `tti`     | Time to Interactive - The time it takes for the page to become fully interactive.                                                            |
| `fpc`     | First Paint - The time recorded By `performance.getEntriesByName("first-paint")[0]`, Can be compared with the fp value we recorded ourselves |
| `fcp`     | First Content Paint                                                                                                                          |

### Performance

The recorded values in Performance correspond to the times in `PerformanceNavigationTiming`.

### Node

| Parameter              | Explanation                         |
| ---------------------- | ----------------------------------- |
| Load First Screen Data | when SSR request ready              |
| On Shell Ready         | when `onShellReady` function called |
| Render Top Chunk       | when `head` tags send               |
| On All Ready           | when `onAllReady` function called   |
| Pipe End               | when stream end                     |

### Resource

| Parameter   | Explanation                                 |
| ----------- | ------------------------------------------- |
| scriptStart | Earliest script request time                |
| scriptEnd   | The latest script end time                  |
| styleStart  | Earliest style request time                 |
| styleEnd    | The latest style end time                   |
| imageStart  | Earliest image request time in first screen |
| imageEnd    | The latest image end time in first screen   |
