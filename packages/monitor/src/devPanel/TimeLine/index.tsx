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
        className={cx(styles.monitorTimeline, {
          [styles.monitorTimelineShow]: showPanel,
        })}
      >
        {source.map((item, index) => (
          <div key={index}>
            <p className={styles.monitorTimelineTitle}>{item.title}</p>
            {item.spans.map((rt, idx) => {
              const lineStyle = {
                left: `${((rt.start - startTime) * 100) / totalTime}%`,
                width: `${((rt.end - rt.start) / totalTime) * 100}%`,
              };

              return (
                <div key={idx}>
                  <div className={styles.monitorTimelineContent}>
                    <span>{rt.name}</span>
                    <span>
                      {rt.end - rt.start}@[{rt.start - startTime},{" "}
                      {rt.end - startTime}]
                    </span>
                  </div>
                  <div
                    className={styles.monitorTimelineLine}
                    style={lineStyle}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

export default TimeLine;
