import { PerformanceMonitor } from "./performance-monitor";
import { BaseMonitor, MonitorType } from "./types";

export type VitalsType = "ps" | "fp" | "dr" | "ld" | "fsn" | "fraf" | "tti";

// 其他的 ttfb,fcp,lcp,cls,inp 用 web-vitals 库来收集
const checkFields: VitalsType[] = [
  "ps",
  "fp",
  "dr",
  "ld",
  "fsn",
  "fraf",
  "tti",
];

// 在 componentDidMount 时调用
export function logTimeToInteractiveTime() {
  window["__TIME_METRICS__"].push(["tti", +new Date()]);
}

export class VitalsMonitor extends BaseMonitor {
  collectData(collectorMap: Map<MonitorType, BaseMonitor<{}>>): void {
    const perfCollector = collectorMap.get("performance") as PerformanceMonitor;

    const { fetchStart = 0 } = perfCollector.value ?? {};

    this.fixGlitchesInBatch({ source: this.value, start: fetchStart });
  }
  name: MonitorType;

  constructor() {
    super();
    this.name = "custom";
  }

  checkReady() {
    this.dataSource = {};
    window["__TIME_METRICS__"].forEach(([key, val]) => {
      // @ts-ignore
      this.dataSource[key] = val;
    });

    // @ts-ignore
    return checkFields.every((key) => this.dataSource[key] !== undefined);
  }

  init() {
    return new Promise<void>((resolve) => {
      const tm = window["__TIME_METRICS__"] || [];
      const originPush = tm.push;
      const complete = () => this.checkReady() && resolve();

      tm.push = (...args) => {
        const result = originPush.apply(tm, args);
        complete();
        return result;
      };

      window["__TIME_METRICS__"] = tm;
      complete();
    });
  }

  get value() {
    const firstPaint = performance.getEntriesByName("first-paint")[0];
    const firstContentfulPaint = performance.getEntriesByName(
      "first-contentful-paint"
    )[0];

    return {
      ...this.dataSource,
      fpc: Math.round(firstPaint.startTime + performance.timeOrigin),
      fcp: Math.round(firstContentfulPaint.startTime + performance.timeOrigin),
    };
  }

  getBoundValue(key: string) {
    if (["ld", "fs"].includes(key)) {
      return 20000;
    }

    return super.getBoundValue(key);
  }
}
