import type { ParetoPage } from '@paretojs/core'
import { mockClientPromise, promiseMap } from '@paretojs/core'
import { MobXProviderContext, observer } from 'mobx-react'
import { Suspense, useContext } from 'react'
import { Image } from '../../utils'
import { Recommends } from './recommends'
import { RecommendsSkeleton } from './recommends/loading'
import type { Repositories } from './store'
import HomeStore from './store'
import { getRecommends, getRecommendsKey } from './stream'
import styles from './style.module.scss'

const Home: ParetoPage = function () {
  const { store } = useContext(MobXProviderContext)
  const { repositories } = store as {
    repositories: Repositories
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>Repositories</div>
      <div className={styles.repos}>
        {repositories.map(repo => (
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
  )
}

Home.getServerSideProps = async () => {
  // stream ssr & init server promise
  promiseMap.set(getRecommendsKey, getRecommends())
  const store = new HomeStore()
  await store.getInitialProps()
  return store
}

Home.setUpClient = async data => {
  // mock client promise, it only will be resolved when server data is ready
  mockClientPromise(getRecommendsKey)
  const store = new HomeStore()
  store.hydrate(
    data as {
      repositories: Repositories
    },
  )
  return store
}

export default observer(Home)
