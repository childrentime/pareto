import type { ParetoPage } from '@paretojs/core'
import { mockClientPromise, promiseMap } from '@paretojs/core'
import { FirstScreen, report } from '@paretojs/core/client'
import { Suspense, useEffect } from 'react'
import { Image, fetchJson } from '../../utils'
import { Recommends } from './recommends'
import { RecommendsSkeleton } from './recommends/loading'
import { getRecommends, getRecommendsKey } from './stream'
import styles from './style.module.scss'

interface InitialData {
  repositories: {
    name: string
    avatar: string
  }[]
}

const Home: ParetoPage<InitialData> = props => {
  const { repositories } = props.initialData

  useEffect(() => {
    report().then(console.log).catch(console.error)
  }, [])

  return (
    <>
      <div
        className={styles.container}
        onClick={() => {
          console.log('container clicked')
        }}
      >
        <div className={styles.title}>Repositories</div>
        <div className={styles.repos}>
          {repositories.map(repo => (
            <div key={repo.name} className={styles.repo}>
              <div>
                <Image src={repo.avatar} preload />
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
  )
}

Home.getServerSideProps = async () => {
  // stream ssr & init server promise
  promiseMap.set(getRecommendsKey, getRecommends())
  // ssr
  const repositories = (await fetchJson('/api/repositories')) as InitialData
  return repositories
}

Home.setUpClient = async () => {
  // mock client promise, it only will be resolved when server data is ready
  mockClientPromise(getRecommendsKey)
}

export default Home
