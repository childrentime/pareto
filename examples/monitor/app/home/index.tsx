import type { ParetoPage } from "@paretojs/core";
import { promiseMap, mockClientPromise } from "@paretojs/core";
import { Suspense, useEffect } from "react";
import { getRecommends, getRecommendsKey } from "./stream";
import { fetchJson, Image } from "../../utils";
import styles from "./style.module.scss";
import { Recommends } from "./recommends";
import { RecommendsSkeleton } from "./recommends/loading";
import { report, FirstScreen } from "@paretojs/core/client";

interface InitialData {
  repositories: {
    name: string;
    avatar: string;
  }[];
}

const Home: ParetoPage<InitialData> = (props) => {
  const { repositories } = props.initialData;

  useEffect(() => {
    report().then(console.log);
  }, []);

  return (
    <>
      <div className={styles.container} onClick={() => {
        console.log('container clicked')
      }}>
        <div className={styles.title}>Repositories</div>
        <div className={styles.repos}>
          {repositories.map((repo) => (
            <div key={repo.name} className={styles.repo}>
              <div>
                <Image src={repo.avatar} preload/>
              </div>
              <div>{repo.name}</div>
            </div>
          ))}
        </div>
        <Suspense fallback={<RecommendsSkeleton />}>
          <Recommends />
        </Suspense>
      </div>
      <FirstScreen />
    </>
  );
};

Home.getServerSideProps = async () => {
  // stream ssr & init server promise
  promiseMap.set(getRecommendsKey, getRecommends());
  // ssr
  const repositories = (await fetchJson("/api/repositories")) as InitialData;
  return repositories;
};

Home.setUpClient = async () => {
  // mock client promise, it only will be resolved when server data is ready
  mockClientPromise(getRecommendsKey);
};

export default Home;
