import styles from './style.module.scss'

interface RecommendData {
  feeds?: {
    name: string
    avatar: string
    time: string
    action: string
    repositoryName: string
    repositoryAvatar: string
    desc: string
  }[]
}

export function Recommends(props: RecommendData) {
  const { feeds = [] } = props

  return (
    <div
      className={styles.container}
      onClick={() => {
        console.log('clicked')
      }}
    >
      <div className={styles.title}>Recommends</div>
      <div className={styles.list}>
        {feeds.map((item, index) => (
          <div className={styles.item} key={index}>
            <div className={styles.user}>
              <div className={styles.avatar}>
                <img src={item.avatar} />
              </div>
              <div>
                <div className={styles.name}>
                  {item.name} <div className={styles.action}>{item.action}</div>
                </div>
                <div className={styles.time}>{item.time}</div>
              </div>
            </div>
            <div className={styles.repository}>
              <div className={styles.repositoryAvatar}>
                <img src={item.repositoryAvatar} />
              </div>
              <div className={styles.repositoryName}>{item.repositoryName}</div>
            </div>
            <div className={styles.desc}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
