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
import { buildTimeline, setup, waitReady } from "./devPanel";
import { TimeLines } from "./devPanel/types";
import { reportWebVitals } from "./vitals";

export * from "./server";
export * from "./script";

export async function report() {
  const waitForNodeMonitorInfos = () => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (window.__NODE_MONITOR_INFOS__) {
          clearInterval(interval);
          resolve(window.__NODE_MONITOR_INFOS__);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        reject(new Error("Timed out waiting for __NODE_MONITOR_INFOS__"));
      }, 10000);
    });
  };

  logTimeToInteractiveTime();
  reportWebVitals();
  await waitForNodeMonitorInfos();

  if (
    window.__NODE_MONITOR_INFOS__ &&
    window.__NODE_MONITOR_INFOS__.showMonitor
  ) {
    await waitReady();
    const timelines = await new Promise<TimeLines[]>((resolve) => {
      setTimeout(async () => {
        const monitorList = [
          VitalsMonitor,
          PerformanceMonitor,
          NodeMonitor,
          ResourceMonitor,
        ];
  
        const monitors = await applyMonitors(monitorList);
        const timelines = buildTimeline(monitors);
        setup(timelines);

        resolve(timelines)
      }, 0);
    });
    return timelines;
  }
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
