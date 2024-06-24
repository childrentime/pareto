import type { ParetoPage } from '@paretojs/core'
import { mockClientPromise, promiseMap } from '@paretojs/core'
import { Suspense } from 'react'
import { Image } from '../../utils'
import { Recommends } from './recommends'
import { RecommendsSkeleton } from './recommends/loading'
import { createHomeStore, useHomeStore } from './store'
import { getRecommends, getRecommendsKey } from './stream'
import styles from './style.module.scss'

const Home: ParetoPage = function () {
  const { repositories } = useHomeStore(state => {
    return {
      repositories: state.repositories,
    }
  })

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
  const store = await createHomeStore()
  return store
}

Home.setUpClient = async data => {
  // mock client promise, it only will be resolved when server data is ready
  mockClientPromise(getRecommendsKey)
  const store = await createHomeStore(data)
  return store
}

export default Home
