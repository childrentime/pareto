import { PerformanceMonitor } from "./performance-monitor";
import { BaseMonitor, MonitorType } from "./types";

const sizeToKB = (i) => Math.round(i / 1024);

export class ResourceMonitor extends BaseMonitor<Record<string, number>> {
  collectData(collectorMap: Map<MonitorType, BaseMonitor<{}>>): void {
    const perfCollector = collectorMap.get("performance") as PerformanceMonitor;

    const { fetchStart } = perfCollector.value;

    this.fixGlitchesInBatch({ source: this.value, start: fetchStart });
  }

  name: MonitorType;

  recordSources: Record<string, number>;

  constructor() {
    super();
    this.name = "resource";
    this.recordSources = {};
  }

  init(): void {
    this.getJSResourceInfo();
    this.dataSource = {
      ...this.getScriptAndStyleTiming(),
      ...this.getFirstScreenImageTiming(),
    };
  }

  get value() {
    return this.dataSource;
  }

  getFirstScreenImageTiming() {
    // 获取所有图片资源的加载时间
    let imageResources = performance
      .getEntriesByType("resource")
      .filter((resource) => {
        return [".jpg", ".jpeg", ".png", ".gif"].some((ext) =>
          resource.name.endsWith(ext)
        );
      }) as PerformanceResourceTiming[];

    // 获取首屏的宽度和高度
    let viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    let viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    // 找出在首屏内的图片元素
    let firstScreenImages = Array.from(
      document.getElementsByTagName("img")
    ).filter((img) => {
      let rect = img.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.top < viewportHeight &&
        rect.left >= 0 &&
        rect.left < viewportWidth
      );
    });

    // 找出在首屏内的图片资源
    let firstScreenImageResources = imageResources.filter((resource) => {
      return firstScreenImages.some((img) => img.src === resource.name);
    });

    // 找到开始加载时间最早和结束加载时间最晚的资源
    let earliestFetchStart = Math.min(
      ...firstScreenImageResources.map((resource) => resource.fetchStart)
    );
    let latestResponseEnd = Math.max(
      ...firstScreenImageResources.map((resource) => resource.responseEnd)
    );

    return {
      imageStart: earliestFetchStart,
      imageEnd: latestResponseEnd,
    };
  }

  getScriptAndStyleTiming() {
    const allScript = Array.from(document.querySelectorAll("script"))
      .filter((script) => script.src)
      .map((v) => v.src);
    const allStyle: string[] = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    ).map((v) => v.href);

    const resourceAry = performance.getEntriesByType(
      "resource"
    ) as PerformanceResourceTiming[];
    const style = resourceAry.filter((item) => allStyle.includes(item.name));
    const script = resourceAry.filter((item) => allScript.includes(item.name));

    const calc = (
      ary: PerformanceResourceTiming[],
      type: "min" | "max",
      key: "fetchStart" | "responseEnd"
    ) =>
      (ary.length &&
        ary.reduce(
          (pre, current) => Math[type](pre, current[key]),
          ary[0][key]
        )) ||
      0;
    const calcMin = (
      ary: PerformanceResourceTiming[],
      key: "fetchStart" | "responseEnd"
    ) => calc(ary, "min", key);
    const calcMax = (
      ary: PerformanceResourceTiming[],
      key: "fetchStart" | "responseEnd"
    ) => calc(ary, "max", key);

    return {
      scriptStart: calcMin(script, "fetchStart"),
      scriptEnd: calcMax(script, "responseEnd"),
      styleStart: calcMin(style, "fetchStart"),
      styleEnd: calcMax(style, "responseEnd"),
    };
  }

  getJSResourceInfo() {
    let totalEncodedBodySize = 0;
    let totalDecodedBodySize = 0;
    let resourceNum = 0;
    let totalTransferSize = 0;
    let cacheResourceNum = 0;
    let transferResourceNum = 0;

    const resourceAry = performance.getEntriesByType(
      "resource"
    ) as PerformanceResourceTiming[];
    const allScript = Array.from(document.querySelectorAll("script")).filter(
      (script) => script.src
    );

    const script = resourceAry.filter((item) => {
      if (
        ["script", "link"].includes(item.initiatorType) &&
        (item.name.endsWith(".js") || item.name.endsWith(".css"))
      ) {
        return allScript.find((scp) => scp.src === item.name);
      }
      return false;
    });

    for (let i = 0; i < script.length; i++) {
      const { transferSize, decodedBodySize, encodedBodySize } = script[
        i
      ] as PerformanceResourceTiming;
      resourceNum += 1;
      totalEncodedBodySize += encodedBodySize;
      totalDecodedBodySize += decodedBodySize;
      transferSize > 0 ? (transferResourceNum += 1) : (cacheResourceNum += 1);
      totalTransferSize += transferSize;
    }

    this.recordSources =  {
      totalEncodedBodySize: sizeToKB(totalEncodedBodySize),
      totalDecodedBodySize: sizeToKB(totalDecodedBodySize),
      resourceNum,
      totalTransferSize: sizeToKB(totalTransferSize),
      cacheResourceNum,
      transferResourceNum,
    };
  }
}
