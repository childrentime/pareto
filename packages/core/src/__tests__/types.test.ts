import { describe, expect, it } from 'vitest'
import type {
  DocumentContext,
  GetDocumentProps,
  HeadComponent,
  HeadProps,
  HtmlAttributes,
} from '../types'
import { DeferredData, defer } from '../types'

describe('DeferredData', () => {
  it('should wrap data in DeferredData', () => {
    const data = { user: 'resolved', activity: Promise.resolve([]) }
    const deferred = new DeferredData(data)
    expect(deferred.data).toBe(data)
    expect(deferred).toBeInstanceOf(DeferredData)
  })
})

describe('defer()', () => {
  it('should return a DeferredData instance', () => {
    const result = defer({ name: 'test' })
    expect(result).toBeInstanceOf(DeferredData)
    expect(result.data.name).toBe('test')
  })

  it('should support mixed resolved and promise values', () => {
    const result = defer({
      resolved: 'value',
      pending: Promise.resolve('async'),
    })
    expect(result.data.resolved).toBe('value')
    expect(result.data.pending).toBeInstanceOf(Promise)
  })
})

describe('Document types', () => {
  it('GetDocumentProps accepts DocumentContext and returns HtmlAttributes', () => {
    const getDocumentProps: GetDocumentProps = (ctx: DocumentContext) => {
      return {
        lang: ctx.params.lang || 'en',
        dir: 'ltr',
      }
    }
    const attrs: HtmlAttributes = getDocumentProps({
      req: {} as DocumentContext['req'],
      params: { lang: 'zh' },
      pathname: '/zh',
      loaderData: undefined,
    })
    expect(attrs.lang).toBe('zh')
    expect(attrs.dir).toBe('ltr')
  })

  it('GetDocumentProps is synchronous', () => {
    const getDocumentProps: GetDocumentProps = ctx => {
      return { lang: ctx.params.lang || 'en' }
    }
    const attrs = getDocumentProps({
      req: {} as DocumentContext['req'],
      params: { lang: 'ja' },
      pathname: '/ja',
      loaderData: null,
    })
    expect(attrs.lang).toBe('ja')
  })

  it('HtmlAttributes supports arbitrary data-* attributes', () => {
    const attrs: HtmlAttributes = {
      lang: 'en',
      'data-theme': 'dark',
      className: 'antialiased',
    }
    expect(attrs.lang).toBe('en')
    expect(attrs['data-theme']).toBe('dark')
    expect(attrs.className).toBe('antialiased')
  })
})

describe('HeadComponent types', () => {
  it('HeadComponent accepts loaderData and params', () => {
    const Head: HeadComponent = ({ loaderData, params }: HeadProps) => {
      return null
    }
    expect(typeof Head).toBe('function')
  })

  it('HeadComponent can be called with props', () => {
    const Head: HeadComponent = ({ loaderData }: HeadProps) => {
      return null
    }
    const props: HeadProps = { loaderData: { title: 'test' }, params: {} }
    expect(() => Head(props)).not.toThrow()
  })
})
