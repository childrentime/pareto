import { NodeMonitor, PerformanceMonitor, ResourceMonitor } from "./client";
import {
  BaseMonitor,
  BaseMonitorConstructor,
  MonitorType,
} from "./client/types";
import {
  VitalsMonitor,
  logTimeToInteractiveTime,
} from "./client/vitals-monitor";
import { buildTimeline, setup } from "./devPanel";
import { reportWebVitals } from "./vitals";

export * from "./server";
export * from "./script";

export function report() {
  logTimeToInteractiveTime();
  const monitorList = [
    VitalsMonitor,
    PerformanceMonitor,
    NodeMonitor,
    ResourceMonitor,
  ];

  applyMonitors(monitorList).then((monitors) => {
    const timelines = buildTimeline(monitors);
    setup(timelines);
  });
  reportWebVitals();
}

async function applyMonitors(monitorList: BaseMonitorConstructor[]) {
  const monitorsMap = monitorList.reduce((acc, Monitor) => {
    const monitor = new Monitor();

    if (!(monitor instanceof BaseMonitor)) {
      throw new Error("[monitor]: exist monitor don‘t extends BaseMonitor");
    }

    if (!monitor.name) {
      throw new Error("[monitor]: monitor’s name miss");
    }

    if (acc[monitor.name]) {
      throw new Error(`[monitor]: repeat monitor name ${monitor.name}`);
    }

    acc.set(monitor.name, monitor);

    return acc;
  }, new Map<MonitorType, BaseMonitor>());

  const monitors = [...monitorsMap.values()];

  return Promise.all(monitors.map((monitor) => monitor.init())).then(() => {
    monitors.forEach((monitor) => {
      monitor.collectData(monitorsMap);
    });

    return monitors;
  });
}
