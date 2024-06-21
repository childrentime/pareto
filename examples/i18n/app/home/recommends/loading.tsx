import { useTranslation } from "react-i18next";
import styles from "./style.module.scss";
import { i18Namespace } from "../../../common";

export const RecommendsSkeleton = () => {
  const feeds = Array.from({ length: 5 }).fill(0);
  const [t] = useTranslation(i18Namespace);

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t('Recommends')}</div>
      <div className={styles.list}>
        {feeds.map((_item, index) => (
          <div
            className={styles.item}
            key={index}
            style={{
              width: 315,
              height: 100,
              flexShrink: 0
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};
