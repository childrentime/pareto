
import { getRecommends, getRecommendsKey } from "./stream";
import { fetchJson } from "../../utils";
import styles from "./style.module.scss";
import { Recommends } from "./recommends";
import { RecommendsSkeleton } from "./recommends/loading";
import { ParetoPage } from "../../types";
import { mockClientPromise, promiseMap } from "../../stream-helpers";
import { Suspense } from "../../polyfill";

interface InitialData {
  repositories: {
    name: string;
    avatar: string;
  }[];
}

const Home: ParetoPage<InitialData> = (props) => {
  const { repositories } = props.initialData;

  return (
    <div className={styles.container}>
      <div className={styles.title}>Repositories</div>
      <div className={styles.repos}>
        {repositories.map((repo) => (
          <div key={repo.name} className={styles.repo}>
            <div>
              <img src={repo.avatar} />
            </div>
            <div>{repo.name}</div>
          </div>
        ))}
      </div>
      {/* @ts-ignore */}
      <Suspense fallback={<RecommendsSkeleton/>} streamKey={getRecommendsKey}>
        <Recommends />
      </Suspense>
    </div>
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
