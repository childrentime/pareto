import { useState } from "react";
import cx from "classnames";
import { TimeLines } from "../types";
import styles from "./style.module.scss";
import Logo from "../Logo";

const TimeLine = ({ source }: { source: TimeLines[] }) => {
  const [showPanel, setShowPanel] = useState(false);

  let startTime = Infinity;
  let endTime = 0;

  source.forEach((item) => {
    item.spans.forEach((span) => {
      startTime = Math.min(startTime, span.start);
      endTime = Math.max(endTime, span.end);
    });
  });

  const totalTime = endTime - startTime;

  return (
    <>
      <Logo onClick={() => setShowPanel(!showPanel)} />
      <div
        className={cx(styles.timelineMonitor, {
          [styles.timelineMonitorVisible]: showPanel,
        })}
      >
        {source.map((item, index) => {
          const { title, spans } = item;
          return (
            <div key={index}>
              <p className={styles.timelineMonitorTitle}>{title}</p>
              <div className={styles.barChart}>
                {spans.map((item) => (
                  <div key={item.name} className={styles.barChartItem}>
                    <div className={styles.barLabel}>
                      {item.name}
                      <span>
                        {item.end - item.start}@[
                        {item.start - startTime},{item.end - startTime}]
                      </span>
                    </div>
                    <div
                      className={styles.bar}
                      style={{
                        left: `${
                          ((item.start - startTime) * 100) / totalTime
                        }%`,
                        width: `${
                          ((item.end - item.start) / totalTime) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default TimeLine;
