import styles from "./style.module.scss";
import { Trans } from "@lingui/macro";

export const RecommendsSkeleton = () => {
  const feeds = Array.from({ length: 5 }).fill(0);

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        {" "}
        <Trans>Recommends</Trans>
      </div>
      <div className={styles.list}>
        {feeds.map((_item, index) => (
          <div
            className={styles.item}
            key={index}
            style={{
              width: 315,
              height: 100,
              flexShrink: 0,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};
