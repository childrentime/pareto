# @paretojs/monitor

[English Version](./README.md)

一个可视化性能面板

## 使用方法

### 服务器

#### 设置

```ts
import { addMonitorMiddleware } from "@paretojs/monitor";
import express from "express";

const app = express();

addMonitorMiddleware(app)({
  // 控制是否在前端展示 Monitor UI
  showMonitor: true,
});
```

#### 标记

```tsx
req.monitor.mark("renderTopChunk");
```

#### 注入到窗口

```tsx
<script
  id="MONITOR"
  dangerouslySetInnerHTML={{ __html: res.locals.monitorInfos }}
/>
```

### 客户端

#### 使用

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

## 报告

`@paretojs/monitor` 收集两种类型的数据。一种是由上述的 `report()` 函数返回的，另一种是使用 `web-vitals` 包收集的。由于 `web-vitals` 收集的数据建议在 `visibilitychange` 和 `pagehide` 事件中报告（参考 `https://github.com/GoogleChrome/web-vitals/blob/main/README.md#batch-multiple-reports-together`），我们将 `web-vitals` 收集的数据存储在 `window['WEB_VITALS']` 中。

### 陷阱

由 `web-vitals` 包收集的交互时间(TTI)比我们自己收集的要长得多。这是因为它等待 DOM 稳定，这与流渲染的特性冲突。

### 报告示例

```tsx
const App = () => {
  useEffect(() => {
    report().then((data) => {
      // 你的报告函数
      sendToAnalytics(data);
    });

    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sendToAnalytics(window["__WEB_VITALS__"]);
      }
    });

    // 注意：Safari 在页面被卸载时并不可靠地触发 `visibilitychange` 事件。如果需要支持 Safari，你也应该在 `pagehide` 事件中清空队列。
    addEventListener("pagehide", () => {
      sendToAnalytics(window["__WEB_VITALS__"]);
    });

    return () => {
      // 移除监听器...
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

## 指标描述

### 自定义

| 参数   | 说明                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| `ps`   | 页面开始 - 头标签中第一个脚本的时间戳                                                                         |
| `fp`   | 首次绘制 - 屏幕上首次绘制发生的时间                                                                           |
| `dr`   | DOM 就绪 - DOM（文档对象模型）就绪的时间                                                                      |
| `ld`   | 加载 - 完整页面加载的时间                                                                                     |
| `fsn`  | 首屏无图 - 首屏渲染结束时间（不考虑图片是否加载完成）                                                         |
| `fraf` | 首次请求动画帧 - 首次调用 RequestAnimationFrame API 的时间                                                    |
| `tti`  | 可交互时间 - 页面变得完全可交互的时间                                                                         |
| `fpc`  | 首次绘制 - 由 `performance.getEntriesByName("first-paint")[0]` 记录的时间，可以与我们自己记录的 fp 值进行比较 |
| `fcp`  | 首次内容绘制                                                                                                  |

### 性能

在性能中记录的值对应于 `PerformanceNavigationTiming` 中的时间。

### Node

| 参数                   | 说明                           |
| ---------------------- | ------------------------------ |
| Load First Screen Data | 当 SSR 请求就绪时              |
| On Shell Ready         | 当 `onShellReady` 函数被调用时 |
| Render Top Chunk       | 当 `head` 标签发送时           |
| On All Ready           | 当 `onAllReady` 函数被调用时   |
| Pipe End               | 当流结束时                     |

### 资源

| 参数        | 说明                     |
| ----------- | ------------------------ |
| scriptStart | 最早的脚本请求时间       |
| scriptEnd   | 最晚的脚本结束时间       |
| styleStart  | 最早的样式请求时间       |
| styleEnd    | 最晚的样式结束时间       |
| imageStart  | 首屏中最早的图片请求时间 |
| imageEnd    | 首屏中最晚的图片结束时间 |
