import { promiseMap } from '@paretojs/core'
import { use } from 'react'
import { Helmet } from 'react-helmet-async'
import { Image } from '../../../utils'
import { getRecommendsKey } from '../stream'
import styles from './style.module.scss'

interface RecommendData {
  feeds: {
    name: string
    avatar: string
    time: string
    action: string
    repositoryName: string
    repositoryAvatar: string
    desc: string
  }[]
}

export function Recommends() {
  const { feeds }: RecommendData = use(promiseMap.get(getRecommendsKey)!)

  return (
    <>
      {/* don't use helmet in streaming component, it's a anti-pattern and will not work */}
      <Helmet>
        <title>Home</title>
      </Helmet>
      <div className={styles.container}>
        <div className={styles.title}>Recommends</div>
        <div className={styles.list}>
          {feeds.map((item, index) => (
            <div className={styles.item} key={index}>
              <div className={styles.user}>
                <div className={styles.avatar}>
                  <Image src={item.avatar} />
                </div>
                <div>
                  <div className={styles.name}>
                    {item.name}{' '}
                    <div className={styles.action}>{item.action}</div>
                  </div>
                  <div className={styles.time}>{item.time}</div>
                </div>
              </div>
              <div className={styles.repository}>
                <div className={styles.repositoryAvatar}>
                  <Image src={item.repositoryAvatar} />
                </div>
                <div className={styles.repositoryName}>
                  {item.repositoryName}
                </div>
              </div>
              <div className={styles.desc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
