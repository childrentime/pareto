import express from 'express'
import React from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import superjson from 'superjson'
import { pageEntries } from './configs/entry'
import { getRuntimeConfig } from './configs/runtime.config'
import { childrenMap } from './polyfill'
import { promiseMap } from './stream-helpers'
import { STREAMING_SERIALIZATION_EVENT } from './stream-helpers/constant'
import type { ParetoPage } from './types'
import { sleep } from './utils'

const app = express()

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

// magically speed up ios rendering
const PADDING_EL = '<div style="height: 0">' + '\u200b'.repeat(300) + '</div>'
const HEAD_CLOSE_HTML = `</head><body>${PADDING_EL}<div id="main">`

app.get('*', async (req, res) => {
  const path = req.path.slice(1)
  if (!pageEntries[path]) {
    return
  }

  const { pages, assets } = getRuntimeConfig()
  // @ts-ignore
  const asset = assets[path]
  const { js, css } = asset
  const jsArr = typeof js === 'string' ? [js] : [...(js || [])]
  const cssArr = typeof css === 'string' ? [css] : [...(css || [])]

  const preloadJS = jsArr.map(js => {
    return <link rel="preload" href={js} as="script" key={js} />
  })
  const loadedCSS = cssArr.map(css => {
    return <link rel="stylesheet" href={css} type="text/css" key={css} />
  })
  const loadedJs = jsArr.map(js => {
    return <script src={js} async key={js} />
  })

  const renderHeader = (metas?: JSX.Element[]) => {
    return renderToStaticMarkup(
      <>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {metas?.map(meta => meta)}
        {loadedCSS.map(css => css)}
        {preloadJS.map(js => js)}
      </>,
    )
  }

  // send head before request backend
  res.set({
    'X-Accel-Buffering': 'no',
    'Content-Type': 'text/html; charset=UTF-8',
  })
  res.write(
    `<!DOCTYPE html><html lang="zh-Hans"><head>${renderHeader()}${HEAD_CLOSE_HTML}`,
  )
  res.flushHeaders()

  // send content
  // @ts-ignore
  const Page = pages[path]
  const initialData = await (Page as ParetoPage).getServerSideProps?.(req, res)
  const content = renderToString(<Page initialData={initialData} />)
  res.write(`${content}</div>`)

  // send inline scripts to resolve promise and replace placeholder
  const keys = [...promiseMap.keys()]
  const promises = keys.map(key => {
    const promise = promiseMap.get(key)
    return promise?.then(data => {
      const jsonData = JSON.stringify(data)

      const resolveScript = `<script>
      window.__STREAM_DATA__ = window.__STREAM_DATA__ || {};
      window.__STREAM_DATA__["${key}"] = ${jsonData};
      const event = new CustomEvent('${STREAMING_SERIALIZATION_EVENT}', {
        detail: '${jsonData}'
      });
      document.dispatchEvent(event);
      </script>`

      // @ts-ignore
      const realHtml = renderToString(
        React.cloneElement(childrenMap.get(key), data),
      )

      const replaceScript = `<script>
        const placeholder = document.getElementById('${key}');  
        placeholder.outerHTML = '${realHtml}';
      </script>`

      res.write(replaceScript)
      res.write(resolveScript)
    })
  })

  await Promise.all(promises)
  // send hydrate script finally
  const hydrateScript = renderToStaticMarkup(
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__INITIAL_DATA__ = '${superjson.stringify(
            initialData?.getState?.() || initialData,
          )}';`,
        }}
      />
      {loadedJs.map(Script => Script)}
    </>,
  )
  res.end(`${hydrateScript}</body></html>`)
})

export { app }
