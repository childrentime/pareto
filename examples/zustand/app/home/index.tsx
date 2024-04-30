import type { ParetoPage } from "@pareto/core";
import { promiseMap, Image, mockClientPromise } from "@pareto/core";
import { Suspense } from "react";
import { getRecommends, getRecommendsKey } from "./stream";
import styles from "./style.module.scss";
import { Recommends } from "./recommends";
import { RecommendsSkeleton } from "./recommends/loading";
import { createHomeStore, useHomeStore } from "./store";

const Home: ParetoPage = function () {
  const { repositories } = useHomeStore((state) => {
    return {
      repositories: state.repositories,
    };
  });

  return (
    <div className={styles.container}>
      <div className={styles.title}>Repositories</div>
      <div className={styles.repos}>
        {repositories.map((repo) => (
          <div key={repo.name} className={styles.repo}>
            <div>
              <Image src={repo.avatar} />
            </div>
            <div>{repo.name}</div>
          </div>
        ))}
      </div>
      <Suspense fallback={<RecommendsSkeleton />}>
        <Recommends />
      </Suspense>
    </div>
  );
};

Home.createPageStore = createHomeStore;

Home.getServerSideProps = async () => {
  // stream ssr & init server promise
  promiseMap.set(getRecommendsKey, getRecommends());
  return {};
};

Home.setUpClientPromise = () => {
  // mock client promise, it only will be resolved when server data is ready
  mockClientPromise(getRecommendsKey);
};

export default Home;
