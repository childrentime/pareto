import type { ParetoPage } from "@paretojs/core";
import { promiseMap,  mockClientPromise } from "@paretojs/core";
import { Suspense, useContext } from "react";
import { getRecommends, getRecommendsKey } from "./stream";
import styles from "./style.module.scss";
import { Recommends } from "./recommends";
import { RecommendsSkeleton } from "./recommends/loading";
import HomeStore, { Repositories } from "./store";
import { MobXProviderContext, observer } from "mobx-react";
import { Image } from "../../utils";

const Home: ParetoPage = function () {
  const { store } = useContext(MobXProviderContext);
  const { repositories } = store as {
    repositories: Repositories;
  };

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

Home.getServerSideProps = async () => {
  // stream ssr & init server promise
  promiseMap.set(getRecommendsKey, getRecommends());
  const store = new HomeStore();
  await store.getInitialProps();
  return store;
};

Home.setUpClient = async (data) => {
  // mock client promise, it only will be resolved when server data is ready
  mockClientPromise(getRecommendsKey);
  const store = new HomeStore();
  store.hydrate(data as any);
  return store;

};

export default observer(Home);
