import styles from "./style.module.scss";

interface IRecommendsSkeletonProps {
  id?: string
}
export const RecommendsSkeleton = (props: IRecommendsSkeletonProps) => {
  const feeds = Array.from({ length: 5 }).fill(0);

  return (
    <div className={styles.container} id={props.id}>
      <div className={styles.title}>Recommends</div>
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
