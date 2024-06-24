import type { Messages } from '@lingui/core'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { paretoRequestHandler } from '@paretojs/core/node'
import accepts from 'accepts'
import express from 'express'
import { initLinguiServer, loadCatalog } from './i18n'
import { sleep } from './utils'

const app = express()

const ABORT_DELAY = 5_000

app.use('/api/repositories', async (req, res) => {
  await sleep(500)
  res.json({
    repositories: [
      {
        name: 'childrentime/reactuse',
        avatar: 'https://avatars.githubusercontent.com/u/58261676?s=16&v=4',
      },
      {
        name: 'childrentime/pareto',
        avatar: 'https://avatars.githubusercontent.com/u/58261676?s=16&v=4',
      },
      {
        name: 'FormidableLabs/react-live',
        avatar: 'https://avatars.githubusercontent.com/u/5078602?s=16&v=4',
      },
    ],
  })
})

app.use('/api/recommends', async (req, res) => {
  await sleep(3000)
  res.json({
    feeds: [
      {
        name: 'vesple',
        avatar: 'https://avatars.githubusercontent.com/u/70858606?s=80&v=4',
        time: 'yesterday',
        action: 'starred your repository',
        repositoryName: 'antfu/vscode-browse-lite',
        repositoryAvatar:
          'https://avatars.githubusercontent.com/u/11247099?s=40&v=4',
        desc: '🚀 An embedded browser in VS Code',
      },
      {
        name: 'vesple',
        avatar: 'https://avatars.githubusercontent.com/u/70858606?s=80&v=4',
        time: 'yesterday',
        action: 'starred your repository',
        repositoryName: 'antfu/vscode-browse-lite',
        repositoryAvatar:
          'https://avatars.githubusercontent.com/u/11247099?s=40&v=4',
        desc: '🚀 An embedded browser in VS Code',
      },
      {
        name: 'vesple',
        avatar: 'https://avatars.githubusercontent.com/u/70858606?s=80&v=4',
        time: 'yesterday',
        action: 'starred your repository',
        repositoryName: 'antfu/vscode-browse-lite',
        repositoryAvatar:
          'https://avatars.githubusercontent.com/u/11247099?s=40&v=4',
        desc: '🚀 An embedded browser in VS Code',
      },
    ],
  })
})

app.get('*', async (req, res) => {
  const path = req.path.slice(1)
  const accept = accepts(req)
  const locale = accept.language(['en', 'zh']) || 'en'
  const messages = loadCatalog(path, locale) as Messages
  initLinguiServer(messages, locale)

  const handler = paretoRequestHandler({
    delay: ABORT_DELAY,
    pageWrapper: Page => {
      return props => (
        <I18nProvider i18n={i18n}>
          <Page {...props} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
            window.__LOCALE__ = "${locale}";
            window.__LOCALE_MESSAGE__ = JSON.parse('${JSON.stringify(messages)}');
          `,
            }}
          />
        </I18nProvider>
      )
    },
  })

  await handler(req, res)
})

export { app }
