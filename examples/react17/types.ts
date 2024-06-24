import type { Request, Response } from 'express'

export interface ParetoPage<
  T extends Record<string, any> = Record<string, any>,
> {
  (props: { initialData: T }): JSX.Element
  getServerSideProps?: (req: Request, res: Response) => Promise<T>
  setUpClient?: (data?: Record<string, any>) => Promise<any>
  [key: string]: any
}

export interface ParetoRuntimeConfig {
  pages: Record<string, ParetoPage>
  assets: Record<
    string,
    {
      js?: string[] | string
      css?: string[] | string
    }
  >
}
